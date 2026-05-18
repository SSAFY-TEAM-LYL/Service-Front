<script setup>
import { RouterLink } from 'vue-router'
</script>

<template>
  <section class="hero">
    <div class="container hero-inner">
      <div class="hero-badge fade-in">🚀 SSAFY 코딩테스트 스터디</div>
      <h1 class="hero-title fade-in stagger-1">
        코딩테스트 준비,<br>
        이제 <span class="highlight">LYL</span>과 함께.
      </h1>
      <p class="hero-desc fade-in stagger-2">
        문제 풀이부터 코드 리뷰, 커뮤니티까지.<br>
        함께 성장하는 코딩테스트 스터디 플랫폼.
      </p>
      <div class="hero-actions fade-in stagger-3">
        <RouterLink to="/signup" class="btn btn-primary btn-lg">무료로 시작하기</RouterLink>
        <RouterLink to="/board" class="btn btn-outline btn-lg">커뮤니티 둘러보기</RouterLink>
      </div>
    </div>
  </section>

  <section class="features">
    <div class="container">
      <div class="features-grid">
        <div class="feature-card fade-in">
          <div class="feature-icon">📝</div>
          <h3 class="feature-title">문제 풀이</h3>
          <p class="feature-desc">카테고리별로 엄선된 코딩테스트 문제를 풀고 실력을 키워보세요.</p>
        </div>
        <div class="feature-card fade-in stagger-1">
          <div class="feature-icon">💻</div>
          <h3 class="feature-title">웹 에디터</h3>
          <p class="feature-desc">별도 설치 없이 브라우저에서 바로 코드를 작성하고 채점받으세요.</p>
        </div>
        <div class="feature-card fade-in stagger-2">
          <div class="feature-icon">👥</div>
          <h3 class="feature-title">커뮤니티</h3>
          <p class="feature-desc">질문하고, 풀이를 공유하고, 함께 성장하는 스터디 공간.</p>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* ===== Hero ===== */
.hero {
  padding: var(--space-16) 0 var(--space-12);
  background: linear-gradient(180deg, var(--color-primary-light) 0%, var(--color-bg) 100%);
}

.hero-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.hero-badge {
  display: inline-block;
  padding: var(--space-1) var(--space-4);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  font-size: var(--font-sm);
  font-weight: 600;
  color: var(--color-primary-dark);
  margin-bottom: var(--space-8);
  box-shadow: var(--shadow-xs);
}

.hero-title {
  font-size: var(--font-5xl);
  font-weight: 800;
  line-height: 1.15;
  letter-spacing: -1.5px;
  margin-bottom: var(--space-6);
  color: var(--color-text);
}

.highlight {
  color: var(--color-primary);
  position: relative;
}

.hero-desc {
  font-size: var(--font-lg);
  color: var(--color-text-secondary);
  line-height: 1.7;
  margin-bottom: var(--space-10);
  max-width: 480px;
}

.hero-actions {
  display: flex;
  gap: var(--space-4);
}

/* ===== Features ===== */
.features {
  padding: var(--space-16) 0;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-6);
}

.feature-card {
  padding: var(--space-8);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-xl);
  background: var(--color-bg);
  transition: all var(--transition-base);
}

.feature-card:hover {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-lg);
  transform: translateY(-4px);
}

.feature-icon {
  font-size: 2rem;
  margin-bottom: var(--space-4);
}

.feature-title {
  font-size: var(--font-lg);
  font-weight: 700;
  margin-bottom: var(--space-2);
}

.feature-desc {
  font-size: var(--font-sm);
  color: var(--color-text-secondary);
  line-height: 1.6;
}

@media (max-width: 768px) {
  .hero-title {
    font-size: var(--font-3xl);
  }
  .features-grid {
    grid-template-columns: 1fr;
  }
  .hero-actions {
    flex-direction: column;
    width: 100%;
  }
}
</style>
