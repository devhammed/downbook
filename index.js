#!/usr/bin/env node

'use strict'

const fs = require('fs')
const libgen = require('libgenesis')
const inquirer = require('inquirer')
const request = require('request')

function main () {
  if (process.argv.length < 3) {
    console.log('Usage: downbook SEARCH_QUERY')
    process.exit(1)
  }

  const query = process.argv[2]

  console.log(`Searching books with title: ${query}\n`)

  libgen(query)
    .then(async result => {
      const answers = await inquirer.prompt([
        {
          type: 'list',
          name: 'ebook',
          message: 'Select the Ebook you want to download...',
          choices: result.map(({ id, title, author, extension, filesize }) => ({
            name: `${title} by ${author} - ${extension} (${filesize})`,
            value: id
          }))
        }
      ])

      const { download, title, extension, author } = result.find(
        item => item.id === answers.ebook
      )

      console.log(`\nDownloading Ebook: ${title}`)

      downloadFile({ download, title, extension, author }).then(() => {
        console.log('\n\nDownload Completed!')
        console.log(
          '\nTool provided by Hammed Oyedele based on LibGenesis NPM library.'
        )
        console.log(
          "\nDon't forget to star the project at https://github.com/devhammed/downbook"
        )
      })
    })
    .catch(err => {
      console.log(`\nOoops! ${err}`)
      process.exit(1)
    })
}

function downloadFile ({ download, title, extension, author }) {
  return new Promise((resolve, reject) => {
    let receivedBytes = 0
    let totalBytes = 0
    const outStream = fs.createWriteStream(`${title}_by_${author}.${extension}`)

    console.log('')

    request(download)
      .on('error', reject)
      .on('end', resolve)
      .on('response', function (data) {
        totalBytes = parseInt(data.headers['content-length'])
      })
      .on('data', function (chunk) {
        receivedBytes += chunk.length
        showDownloadingProgress(receivedBytes, totalBytes)
      })
      .pipe(outStream)
  })
}

function showDownloadingProgress (received, total) {
  const percentage = ((received * 100) / total).toFixed(2)
  process.stdout.write(process.platform === 'win32' ? '\\033[0G' : '\r')
  process.stdout.write(
    `${percentage} % | ${received} bytes downloaded out of ${total} bytes.`
  )
}

main()
