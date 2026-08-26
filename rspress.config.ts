import { defineConfig } from 'rspress/config'

const siteConfigOptions = {
  root: 'docs',
  title: 'AToolBox 插件开发',
  description: 'AToolBox Electron 插件开发者文档',
  lang: 'zh-CN',
  icon: '/favicon.svg',
  themeConfig: {
    socialLinks: [],
    nav: [
      { text: '1. 下载插件模板', link: '/example' },
      { text: '2. 开发', link: '/getting-started' },
      { text: '3. 选择插件', link: '/select-plugin' },
      { text: '4. 调试', link: '/debugging' },
      { text: '5. 到开发者后台上传插件', link: '/release' },
      { text: '开放 API', link: '/api/plugin-api' }
    ],
    sidebar: {
      '/': [
        {
          text: '开发流程',
          items: [
            { text: '1. 下载插件模板', link: '/example' },
            { text: '2. 开发', link: '/getting-started' },
            { text: '3. 选择插件', link: '/select-plugin' },
            { text: '4. 调试', link: '/debugging' },
            { text: '5. 到开发者后台上传插件', link: '/release' }
          ]
        },
        {
          text: '开放 API',
          items: [
            { text: '受控插件 API', link: '/api/plugin-api' },
            { text: 'TypeScript 类型参考', link: '/api/types' },
            { text: '事件、类型与错误', link: '/api/contracts' }
          ]
        },
        {
          text: '开发参考',
          items: [
            { text: '运行模型与目录结构', link: '/runtime' },
            { text: 'Manifest 规范', link: '/manifest' },
            { text: '权限与能力矩阵', link: '/permissions' },
            { text: '版本与兼容性', link: '/compatibility' }
          ]
        },
      ]
    },
    footer: {
      message: 'AToolBox 插件开发文档'
    }
  }
}
// Rspress 站点配置选项。

const siteConfig = defineConfig(siteConfigOptions)
// Rspress 最终配置对象。

export default siteConfig
