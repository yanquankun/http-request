import type { Config } from 'jest'

const config: Config = {
  transform: {
    '^.+\\.tsx?$': 'ts-jest', // 使用 ts-jest 处理 TypeScript 文件
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'], // 支持的文件扩展名
  collectCoverage: true, // 启用覆盖率报告
  collectCoverageFrom: [
    'request/**/*.ts', // 收集 request 文件夹下的覆盖率
    '!**/node_modules/**', // 排除 node_modules
    '!**/__tests__/**', // 排除测试文件
  ],
  coverageDirectory: 'coverage', // 覆盖率报告输出目录
  testMatch: ['**/__tests__/**/*.test.(ts|tsx)'], // 匹配测试文件
}

export default config
