const path = require('path')
const util = require('util')
const async = require('async')
const fs = require('fs')
const YAML = require('yamljs')
// const replace = require('replace')

const logger = require(path.resolve(__dirname, 'logging.js'))('out.log')

const BOOKS = [
    {
        "BOOK": "r8_3",
        "FIRST_PAGE": 78,
        "LAST_PAGE": 276
    }
]
let bnr = 0

const BOOK = BOOKS[bnr].BOOK
const FIRST_PAGE = BOOKS[bnr].FIRST_PAGE
const LAST_PAGE = BOOKS[bnr].LAST_PAGE


fs.access(BOOK + '.txt', (err) => {
  if (!err) {
    console.log('readConvertedFile ' + BOOK + '.txt')
    readConvertedFile(BOOK + '.txt')
    return;
  }
  console.log('Convert file ' + BOOK + '.pdf')
  var exec = require('child_process').exec
  var cmd = 'pdftotext "' + BOOK + '.pdf" -nopgbrk -enc UTF-8 -f ' + FIRST_PAGE + ' -l ' + LAST_PAGE + ' -layout'
  exec(cmd, function(error, stdout, stderr) {
    let filename = BOOK + '.txt'
    readConvertedFile(filename)
  })
})


const readConvertedFile = (filename) => {
  const lineReader = require('readline').createInterface({
    input: fs.createReadStream(filename)
  })

  let pages = {}
  let raw_lines = []
  let skip_line_after_pagenum = true
  let page_number_re = /^ {0,125}([0-9]{1,3})$/

  lineReader.on('line', function (line) {
    if (skip_line_after_pagenum) {
      skip_line_after_pagenum = false
      return
    }
    if (line === '') { return }

    let match = page_number_re.exec(line)
    if (match) {
      skip_line_after_pagenum = true
      let page_number = match[1]
      // process.stdout.cursorTo(0)
      // process.stdout.write('page_number: ' + page_number)
      pages[page_number] = {n:page_number, lines:mergePage(raw_lines)}
      // console.log(pages[page_number].lines.join("\n"));
      // process.exit(1)
      raw_lines = []
      return
    }
    // let page_name_re = /^( {0,120}[A-ZÕÜÄÖŠŽ\-]{3,})$/
    // if (page_name_re.exec(line)) { return }
    raw_lines.push(line)
    return
  })

  lineReader.on('close', function (line) {
    console.log('converted ' + Object.keys(pages).length + ' pages from pdf.')
    readRecords(pages)
  })

}


const mergePage = function(raw_lines) {
  // console.log(JSON.stringify(raw_lines, null, 4))
  function findSplit(raw_lines, log) {
    let positionMap = []
    for (var i = 0; i < 150; i++) {
      positionMap[i] = true
    }
    raw_lines.forEach(function(line) {
      if (log) { console.log(line) }
      let temp = ''
      for (var i = 0; i < line.length; i++) {
        positionMap[i] = positionMap[i] && (line.charAt(i) === ' ' ? true : false)
        // console.log(i,line.charAt(i))
        temp = temp + (line.charAt(i) === ' ' ? '+' : '-')
      }
      if (log) { console.log(temp) }
    })
    if (log) { return }
    split_re = /^(\-*)(\+*)(\-*)\+/
    let match = split_re.exec(
      positionMap
        .map(function(n){ return n ? '+' : '-' })
        .join('')
    )
    // In case of pattern mismatch
    // if (match[3] === '' || match[2].charAt(0) !== '+') {
    //   console.log('ERR');
    //   findSplit(raw_lines, true)
    //   console.log(positionMap
    //     .map(function(n){ return n ? '+' : '-' })
    //     .join(''))
    //   console.log(JSON.stringify({match:match}, null, 4))
    //   process.exit()
    // }
    // console.log(' left:',(match[1].length + 1))
    // console.log(JSON.stringify(positionMap, null, 4));
    // process.exit()
    return {left: match[1].length, split: match[2].length}
  }

  let lefthalf = []
  let righthalf = []
  let split = findSplit(raw_lines)
  let line_split_str = '^(.{1,' + split.left + '}).{0,' + split.split + '}(.*)$'
  let line_split_re = new RegExp(line_split_str)
  raw_lines.forEach(function(line) {
    match = line_split_re.exec(line)
    if (match) {
      if (match[1].trim().length > 1) {
        lefthalf.push((match[1]).trim())
      }
      if (match[2] && match[2].trim().length > 1) {
        righthalf.push((match[2]).trim())
      }
    }
  })
  // console.log(JSON.stringify(lefthalf.concat(righthalf), null, 4))
  return lefthalf.concat(righthalf)
}


const readRecords = function(pages) {
  const joinRows = function(record, line) {
    let re = /[^0-9]-$/
    if (record === '') { return line }
    if (re.test(record)) {
      return record.slice(0, (record.length - 1)) + line
    }
    if (record.charAt(record.length - 1) === '.' && /^[0-9]/.test(line)) {
      return record + line
    }
    re = /[0-9]-$/
    if (re.test(record)) {
      return record + line
    }
    return record + ' ' + line
  }

  let record = ''
  let records = []
  let re = /(]| \.)$/
  Object.keys(pages).forEach(function(ix) {
    pages[ix].lines.forEach(function(line) {
      record = joinRows(record, line)
      if (re.test(line)) {
        record = record.replace( /  +/g, ' ' )
        PARANDUSED.line.forEach(function(parandus) {
          let re = new RegExp(parandus.f, 'g')
          record = record.replace(re, parandus.t)
        })
        // Poolitusmärke eemaldades kadusid sidekriipsud ka liitnimede seest.
        // Convert all CamelCaseStrings to Dash-Separated-Strings
        // re = /([A-ZŠ])([A-ZŠ])([a-z])|([a-z])([A-ZŠ])/g
        // line = line.replace(re, '$1$4-$2$3$5')
        // leftstream.write(record + '\n')
        record = record.split('\n')
        records = records.concat(record)
        record = ''
      }
    })
  })
  // console.log(JSON.stringify(records, null, 4))

  console.log("==========");
  // console.log(records.join("\n"));
  // process.exit(1)
  parseRecords(records)
}



const CSVSTREAM = fs.createWriteStream(BOOK + '_isikud.csv')
const csvWrite = function csvWrite(isik) {
  CSVSTREAM.write(isik.kirje)
}


const queue = require('async/queue')
var q = queue(function(task, callback) {
  // console.log('Start ' + task.id)
  esClient.create(task, function(error, response) {
    if (error) {
      if (error.status === 409) {
        console.log('Skip allready imported ' + task.id)
        return callback(null)
      }
      if (error.status === 408) {
        console.log('Timed out for ' + task.id)
        q.push(task, callback)
        return // callback next time
      }
      console.log('Failed ' + task.id)
      return callback(error)
    }
    console.log('Inserted ' + task.id)
    return callback(null)
  })
}, 5)
q.drain = function() {
  console.log('all items have been processed')
}

const save2db = function save2db(isik, callback) {
  let create = {}
  create.index = 'isikud'
  create.type = 'isik'
  create.id = isik.id
  create.body = isik

  // console.log('enqueue ', isik.id);
  q.push(create, function(error) {
    if (error) {
      return callback(error)
    }
    return callback(null)
  })
}


const leftPad = function(i) {
  let pad = "00000"
  return pad.substring(0, pad.length - i.length) + i.toString()
}

var isikud = []
const parseRecords = function(records) {
  console.log('parseRecords');
  let i = 1
  records.forEach(function(record) {
    i++
    logger.log(record, i)

    PARANDUSED.split.forEach(function(parandus) {
      let re = new RegExp(parandus.f, 'g')
      record = record.replace(re, parandus.t)
    })
    // logger.log(record, i)
    let _records = record.split('\n')
    _records.forEach(function(record) {
      parseRecord(record)
      // logger.log(record, i)
    })
  })
}


let unmatched = 0
const parseRecord = function(record) {
  let isik = {
    kirje: record
  }
  logger.log(isik)
  // console.log(isik)

}
