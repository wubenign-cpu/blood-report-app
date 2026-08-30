import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // GitHub Pages project-site 배포 시 저장소 이름 하위 경로에서 서빙되므로 base를 맞춰줍니다.
  base: process.env.GITHUB_PAGES ? '/blood-report-app/' : '/',
})
