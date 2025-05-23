import { exec } from 'child_process'
import fs from 'fs'
import path from 'path'

export enum VersionType {
  Major = 'major',
  Minor = 'minor',
  Patch = 'patch',
  Custom = 'custom',
}

export enum TagType {
  Latest = 'latest',
  Beta = 'beta',
  Alpha = 'alpha',
  Next = 'next',
  Previous = 'previous',
  Custom = 'custom',
}

const execCommand = (command: string) => {
  return new Promise((resolve, reject) => {
    exec(command, (error: any, stdout: string, stderr: string) => {
      if (error) {
        console.error(`Error: ${error.message}`)
        reject(error)
      }
      if (stderr) {
        console.error(`stderr: ${stderr}`)
        reject(stderr)
      }
      resolve(stdout)
    })
  })
}

const isHasPublishHistory = (
  packageName: string = '@vexjs/http-request',
): Promise<boolean> => {
  return new Promise((resolve) => {
    exec(
      `npm view ${packageName} version`,
      (error: any, stdout: string, stderr: string) => {
        if (error) {
          resolve(false)
        }
        resolve(true)
      },
    )
  })
}

const isVaildVersion = (version: string) => {
  const versionRegex = /^\d+\.\d+\.\d+$/
  return versionRegex.test(version)
}

const getPkg = () => {
  let pkg
  try {
    pkg = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../package.json'), 'utf-8'),
    )
    return pkg
  } catch (error) {
    console.error('Error reading package.json:', error)
    return null
  }
}

/**
 * @description: 发布包
 * @param {string} version - 版本号
 * @returns {Promise<void>}
 */
const publish = async (version: string, tag: TagType = TagType.Latest) => {
  // --tag:为发布的包添加一个特定的标签
  // 这个标签可以让用户使用 npm install package@tagname 安装特定版本
  const command = `npm publish --access public --tag ${tag}`
  try {
    const result = await execCommand(command)
    console.log(`Publish result: ${result}，version: ${version}`)
  } catch (error) {
    console.error(`Publish error: ${error}`)
    process.exit(1)
  }
}

/**
 * @description: 更新发布版本
 * @param {string} version - 版本号
 * @returns {Promise<void>}
 */
const publishVersion = async (
  type: VersionType,
  version?: string,
): Promise<string> => {
  let command

  switch (type) {
    case VersionType.Major:
      // 增加主版本号（例如 1.0.0 变为 2.0.0）
      command = `npm version major --no-git-tag-version`
      break
    case VersionType.Minor:
      // 增加次版本号（例如 1.0.0 变为 1.1.0）
      command = `npm version minor --no-git-tag-version`
      break
    case VersionType.Patch:
      // 增加补丁版本号（例如 1.0.0 变为 1.0.1）
      command = `npm version patch --no-git-tag-version`
      break
    default:
      // 将版本更新为指定版本
      command = `npm version ${version} --no-git-tag-version`
      break
  }

  try {
    const result = await execCommand(command)
    console.log(`Version publish result: ${result}`)
    return result as string
  } catch (error) {
    console.error(`Version publish error: ${error}`)
    process.exit(1)
  }
}

export default {
  isVaildVersion,
  getPkg,
  execCommand,
  publish,
  publishVersion,
  isHasPublishHistory,
}
