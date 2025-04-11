import publishUtil from './publishUtil'
import { VersionType } from './publishUtil'
import rl from './readline'

const args = process.argv.slice(2)
let version = args[0]

async function startShellQA() {
  const versionOptions = [
    '自定义版本',
    'patch（[x,y,z]=>[x,y,z+1]）',
    'minor （[x,y,z]=>[x,y+1,0]）',
    'major （[x,y,z]=>[x+1,0,0]）',
  ]

  const rlIns = new rl()

  return new Promise((resolve) => {
    rlIns.select('请选择版本升级类型：', versionOptions).then(async (index) => {
      switch (index) {
        case 0:
          const setVersion = async (message: string) => {
            const ver = ((await rlIns.input(message)) as string) || ''
            if (!publishUtil.isVaildVersion(ver)) {
              console.log('版本号不合法，请重新输入\n')
              await setVersion(message)
            } else {
              version = ver
              await publishUtil.publishVersion(VersionType.Custom, version)
            }
          }
          await setVersion('请输入版本号：')
          break
        case 1:
          version = await publishUtil.publishVersion(VersionType.Patch)
          break
        case 2:
          version = await publishUtil.publishVersion(VersionType.Minor)
          break
        case 3:
          version = await publishUtil.publishVersion(VersionType.Major)
          break
      }
      resolve(rlIns.close())
    })
  })
}

async function publish() {
  if (!publishUtil.isVaildVersion(version)) {
    console.log('版本号不合法，将进行交互式输入\n')
    await startShellQA()
  } else {
    await publishUtil.publishVersion(VersionType.Custom, version)
  }

  console.log(`开始发布版本：${version}`)
  // publishUtil.publish(version).then(() => {
  //   console.log(`发布完成，版本号：${version}`)
  // })
}

publish()
