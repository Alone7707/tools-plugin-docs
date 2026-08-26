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
      { text: '插件模板下载', link: '/example' },
      { text: '开放 API', link: '/api/plugin-api' },
      { text: '开发教程', link: '/getting-started' },
      { text: '调试教程', link: '/debugging' },
      { text: '后台地址', link: 'https://tools.770733914.xyz/admin' },
      { text: '上传教程', link: '/release' }
    ],
    sidebar: {
      '/': [
        {
          text: '插件模板下载',
          items: [
            { text: '下载可运行模板', link: '/example' }
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
          text: '开发教程',
          items: [
            { text: '快速开始', link: '/getting-started' },
            { text: '运行模型与目录结构', link: '/runtime' },
            { text: 'Manifest 规范', link: '/manifest' },
            { text: '权限与能力矩阵', link: '/permissions' }
          ]
        },
        {
          text: '调试教程',
          items: [
            { text: '本地调试', link: '/debugging' },
            { text: '版本与兼容性', link: '/compatibility' }
          ]
        },
        {
          text: '后台地址',
          items: [
            { text: '打开插件后台', link: 'https://tools.770733914.xyz/admin' }
          ]
        },
        {
          text: '上传教程',
          items: [
            { text: '上传、审核与发布', link: '/release' }
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
