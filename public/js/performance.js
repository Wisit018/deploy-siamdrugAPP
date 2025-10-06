// Frontend Performance Optimizations
class PerformanceManager {
  constructor() {
    this.debounceTimers = new Map();
    this.cache = new Map();
    this.cacheTTL = 5 * 60 * 1000; // 5 minutes
  }

  // Debounce function calls to prevent excessive API requests
  debounce(key, func, delay = 300) {
    if (this.debounceTimers.has(key)) {
      clearTimeout(this.debounceTimers.get(key));
    }
    
    const timer = setTimeout(() => {
      func();
      this.debounceTimers.delete(key);
    }, delay);
    
    this.debounceTimers.set(key, timer);
  }

  // Simple client-side caching
  getCached(key) {
    const item = this.cache.get(key);
    if (item && Date.now() - item.timestamp < this.cacheTTL) {
      return item.data;
    }
    this.cache.delete(key);
    return null;
  }

  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  // Lazy loading for images
  lazyLoadImages() {
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          observer.unobserve(img);
        }
      });
    });

    images.forEach(img => imageObserver.observe(img));
  }

  // Optimize sessionStorage usage
  cleanupSessionStorage() {
    const keys = Object.keys(sessionStorage);
    const now = Date.now();
    
    keys.forEach(key => {
      if (key.startsWith('workflow.')) {
        try {
          const data = JSON.parse(sessionStorage.getItem(key));
          // Remove old workflow data (older than 1 hour)
          if (data.timestamp && now - data.timestamp > 60 * 60 * 1000) {
            sessionStorage.removeItem(key);
          }
        } catch (e) {
          // Remove corrupted data
          sessionStorage.removeItem(key);
        }
      }
    });
  }

  // Virtual scrolling for large lists
  createVirtualScroller(container, itemHeight, totalItems, renderItem) {
    const visibleItems = Math.ceil(container.clientHeight / itemHeight) + 2;
    let scrollTop = 0;
    
    const updateScroll = () => {
      const startIndex = Math.floor(scrollTop / itemHeight);
      const endIndex = Math.min(startIndex + visibleItems, totalItems);
      
      container.innerHTML = '';
      container.style.height = `${totalItems * itemHeight}px`;
      
      for (let i = startIndex; i < endIndex; i++) {
        const item = document.createElement('div');
        item.style.position = 'absolute';
        item.style.top = `${i * itemHeight}px`;
        item.style.height = `${itemHeight}px`;
        item.style.width = '100%';
        item.innerHTML = renderItem(i);
        container.appendChild(item);
      }
    };
    
    container.addEventListener('scroll', () => {
      scrollTop = container.scrollTop;
      updateScroll();
    });
    
    updateScroll();
  }

  // Optimize form submissions
  optimizeFormSubmission(formId, submitHandler) {
    const form = document.getElementById(formId);
    if (!form) return;

    let isSubmitting = false;
    
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      if (isSubmitting) return;
      
      isSubmitting = true;
      const submitButton = form.querySelector('button[type="submit"]');
      const originalText = submitButton.textContent;
      
      try {
        submitButton.textContent = 'กำลังบันทึก...';
        submitButton.disabled = true;
        
        await submitHandler(form);
        
      } catch (error) {
        console.error('Form submission error:', error);
        alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      } finally {
        isSubmitting = false;
        submitButton.textContent = originalText;
        submitButton.disabled = false;
      }
    });
  }

  // Optimize API calls with retry logic
  async fetchWithRetry(url, options = {}, maxRetries = 3) {
    let lastError;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await fetch(url, options);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return response;
      } catch (error) {
        lastError = error;
        
        if (i < maxRetries - 1) {
          const delay = Math.pow(2, i) * 1000; // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
  }

  // Initialize performance optimizations
  init() {
    // Cleanup sessionStorage on page load
    this.cleanupSessionStorage();
    
    // Setup lazy loading
    if ('IntersectionObserver' in window) {
      this.lazyLoadImages();
    }
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
      this.debounceTimers.forEach(timer => clearTimeout(timer));
    });
  }
}

// Initialize performance manager
const perfManager = new PerformanceManager();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => perfManager.init());
} else {
  perfManager.init();
}

// Export for use in other scripts
window.PerformanceManager = PerformanceManager;
window.perfManager = perfManager;
