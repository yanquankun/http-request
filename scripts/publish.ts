import publishUtil from './publishUtil'

const args = process.argv.slice(2)
let version = args[0]

function updateVersion() {
  if (!version || !publishUtil.isVaildVersion(version)) {
    // 如果没有传入版本号，则默认进行patch升级
    console.log('没有传入版本号，默认进行patch升级')
    return publishUtil.publishVersion('patch')
  } else {
    console.log(`传入版本号：${version}`)
    return publishUtil.publishVersion(version)
  }
}

async function publish() {
  const version = await updateVersion()
  // await publishUtil.publish(version)
  console.log(`发布完成，版本号：${version}`)
}

publish()
