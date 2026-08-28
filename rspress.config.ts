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
      { text: '5. 构建插件包', link: '/build-plugin' },
      { text: '6. 到开发者后台上传插件', link: '/release' },
      { text: 'API 参考', link: '/api/plugin-api' }
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
            { text: '5. 构建插件包', link: '/build-plugin' },
            { text: '6. 到开发者后台上传插件', link: '/release' }
          ]
        },
        {
          text: 'API 参考',
          items: [
            { text: 'API 总览', link: '/api/plugin-api' },
            { text: '事件', link: '/api/events' },
            { text: '窗口', link: '/api/window' },
            { text: '复制', link: '/api/copy' },
            { text: '输入', link: '/api/input' },
            { text: '系统', link: '/api/system' },
            { text: '屏幕', link: '/api/screen' },
            { text: '用户', link: '/api/user' },
            { text: '数据存储', link: '/api/db' },
            { text: '动态指令', link: '/api/features' }
          ]
        },
        {
          text: '说明',
          items: [
            { text: 'manifest.json 字段', link: '/manifest' }
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
