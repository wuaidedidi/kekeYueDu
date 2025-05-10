<template>
  <div class="app-container">
    <!-- 应用启动动画 - 3D书本效果 -->
    <div class="app-splash-screen" v-if="!appLoaded">
      <div class="splash-content">
        <div class="splash-logo-container">
          <div class="book-wrapper">
            <div class="book">
              <div class="book-page book-page-1">
                <div class="page-content">
                  <div class="line line-1"></div>
                  <div class="line line-2"></div>
                  <div class="line line-3"></div>
                </div>
              </div>
              <div class="book-page book-page-2">
                <div class="page-content">
                  <div class="line line-1"></div>
                  <div class="line line-2"></div>
                  <div class="line line-3"></div>
                </div>
              </div>
              <div class="book-page book-page-3">
                <div class="page-content">
                  <div class="line line-1"></div>
                  <div class="line line-2"></div>
                  <div class="line line-3"></div>
                </div>
              </div>
              <div class="book-page book-page-4">
                <div class="page-content">
                  <div class="line line-1"></div>
                  <div class="line line-2"></div>
                  <div class="line line-3"></div>
                </div>
              </div>
              <div class="book-page book-page-5">
                <div class="page-content">
                  <div class="line line-1"></div>
                  <div class="line line-2"></div>
                  <div class="line line-3"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="app-title">可可阅读</div>
        <div class="app-description">创意写作，轻松阅读</div>
        <div class="loading-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
      <div id="particles-js" class="particles"></div>
    </div>

    <!-- 应用内容 -->
    <router-view v-if="appLoaded"></router-view>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'

const appLoaded = ref(false)

onMounted(() => {
  // 加载粒子效果
  loadParticles()

  // 模拟加载时间，实际应用中可以根据资源加载情况触发
  setTimeout(() => {
    appLoaded.value = true
  }, 2500)
})

const loadParticles = () => {
  // 动态加载粒子库
  const script = document.createElement('script')
  script.src = 'https://cdn.jsdelivr.net/particles.js/2.0.0/particles.min.js'
  script.onload = () => {
    if (window.particlesJS) {
      window.particlesJS('particles-js', {
        particles: {
          number: {
            value: 80,
            density: {
              enable: true,
              value_area: 800,
            },
          },
          color: {
            value: '#ffffff',
          },
          shape: {
            type: 'circle',
          },
          opacity: {
            value: 0.5,
            random: false,
          },
          size: {
            value: 3,
            random: true,
          },
          line_linked: {
            enable: true,
            distance: 150,
            color: '#ffffff',
            opacity: 0.4,
            width: 1,
          },
          move: {
            enable: true,
            speed: 2,
            direction: 'none',
            random: false,
            straight: false,
            out_mode: 'out',
            bounce: false,
          },
        },
        interactivity: {
          detect_on: 'canvas',
          events: {
            onhover: {
              enable: true,
              mode: 'grab',
            },
            onclick: {
              enable: true,
              mode: 'push',
            },
            resize: true,
          },
        },
        retina_detect: true,
      })
    }
  }
  document.body.appendChild(script)
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}

.app-container {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

.app-splash-screen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 9999;
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  display: flex;
  justify-content: center;
  align-items: center;
  transition:
    opacity 0.5s ease-out,
    visibility 0.5s ease-out;
  color: white;
}

.splash-content {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.splash-logo-container {
  margin-bottom: 30px;
}

.app-title {
  font-size: 36px;
  font-weight: bold;
  margin-bottom: 10px;
  letter-spacing: 2px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  animation: fadeIn 1s ease-out;
}

.app-description {
  font-size: 16px;
  margin-bottom: 30px;
  opacity: 0.8;
  animation: fadeIn 1.5s ease-out;
}

.particles {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

/* 3D 书本效果 */
.book-wrapper {
  perspective: 1000px;
  width: 150px;
  height: 200px;
  margin: 0 auto;
  margin-bottom: 20px;
}

.book {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  transform: rotateY(10deg) rotateX(10deg);
  animation: bookFloat 4s ease-in-out infinite;
}

.book-page {
  position: absolute;
  width: 100%;
  height: 100%;
  background: #fff;
  border-radius: 5px;
  transform-origin: left center;
  transform-style: preserve-3d;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

.book-page-1 {
  transform: rotateY(0deg);
  background-color: #e9f5ff;
  animation: page1 18s ease-in-out infinite;
}

.book-page-2 {
  transform: rotateY(10deg);
  background-color: #f0f7ff;
  animation: page2 18s ease-in-out infinite;
}

.book-page-3 {
  transform: rotateY(20deg);
  background-color: #f7faff;
  animation: page3 18s ease-in-out infinite;
}

.book-page-4 {
  transform: rotateY(30deg);
  background-color: #fcfdff;
  animation: page4 18s ease-in-out infinite;
}

.book-page-5 {
  transform: rotateY(40deg);
  background-color: #ffffff;
  animation: page5 18s ease-in-out infinite;
}

.page-content {
  padding: 30px 20px;
}

.line {
  height: 6px;
  background: rgba(0, 0, 0, 0.1);
  margin-bottom: 15px;
  border-radius: 3px;
}

.line-1 {
  width: 70%;
}

.line-2 {
  width: 90%;
}

.line-3 {
  width: 50%;
}

.loading-dots {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 20px;
}

.loading-dots span {
  width: 10px;
  height: 10px;
  margin: 0 5px;
  background-color: white;
  border-radius: 50%;
  display: inline-block;
  animation: dots 1.4s infinite ease-in-out both;
}

.loading-dots span:nth-child(1) {
  animation-delay: -0.32s;
}

.loading-dots span:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes dots {
  0%,
  80%,
  100% {
    transform: scale(0);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes bookFloat {
  0%,
  100% {
    transform: rotateY(10deg) rotateX(10deg) translateY(0);
  }
  50% {
    transform: rotateY(12deg) rotateX(12deg) translateY(-10px);
  }
}

@keyframes page1 {
  0%,
  15%,
  100% {
    transform: rotateY(0deg);
  }
  20%,
  25% {
    transform: rotateY(-30deg);
  }
  30%,
  35% {
    transform: rotateY(-50deg);
  }
  40%,
  45% {
    transform: rotateY(-70deg);
  }
  50%,
  55% {
    transform: rotateY(-90deg);
  }
  60%,
  95% {
    transform: rotateY(-120deg);
  }
}

@keyframes page2 {
  0%,
  20%,
  100% {
    transform: rotateY(10deg);
  }
  25%,
  30% {
    transform: rotateY(-20deg);
  }
  35%,
  40% {
    transform: rotateY(-40deg);
  }
  45%,
  50% {
    transform: rotateY(-60deg);
  }
  55%,
  95% {
    transform: rotateY(-90deg);
  }
}

@keyframes page3 {
  0%,
  25%,
  100% {
    transform: rotateY(20deg);
  }
  30%,
  35% {
    transform: rotateY(-10deg);
  }
  40%,
  45% {
    transform: rotateY(-30deg);
  }
  50%,
  95% {
    transform: rotateY(-60deg);
  }
}

@keyframes page4 {
  0%,
  30%,
  100% {
    transform: rotateY(30deg);
  }
  35%,
  40% {
    transform: rotateY(-0deg);
  }
  45%,
  95% {
    transform: rotateY(-30deg);
  }
}

@keyframes page5 {
  0%,
  35%,
  100% {
    transform: rotateY(40deg);
  }
  40%,
  95% {
    transform: rotateY(10deg);
  }
}
</style>
