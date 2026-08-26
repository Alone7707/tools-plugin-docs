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
      { text: '指南', link: '/getting-started' },
      { text: '插件 API', link: '/api/plugin-api' },
      { text: 'Electron Bridge', link: '/api/electron-bridge' },
      { text: '规范参考', link: '/reference' },
      { text: '发布', link: '/release' }
    ],
    sidebar: {
      '/': [
        {
          text: '开始开发',
          items: [
            { text: '概览', link: '/' },
            { text: '快速开始', link: '/getting-started' },
            { text: '运行模型与目录结构', link: '/runtime' },
            { text: 'Manifest 规范', link: '/manifest' },
            { text: '完整示例插件', link: '/example' }
          ]
        },
        {
          text: 'API 参考',
          items: [
            { text: '受控插件 API（推荐）', link: '/api/plugin-api' },
            { text: 'TypeScript 类型参考', link: '/api/types' },
            { text: 'Electron Bridge 完整清单', link: '/api/electron-bridge' },
            { text: '事件、类型与错误', link: '/api/contracts' },
            { text: '权限与能力矩阵', link: '/permissions' }
          ]
        },
        {
          text: '工程流程',
          items: [
            { text: '本地调试', link: '/debugging' },
            { text: '上传、审核与发布', link: '/release' },
            { text: '版本与兼容性', link: '/compatibility' }
          ]
        }
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
