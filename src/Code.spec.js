/**
 * Concat logs to return to API call
 */
let log = '';
function loggerAPI(msg) {
  if (msg) {
    log += `${msg}\n`;
  }
  return log;
}

/**
 * Init test with GasT to run tests on Apps Script
 *
 * @param {switchLogger} Switch logger for between GCP and API call
 */
function initTest(customLogger) {
  // GasT Initialization.
  if ((typeof GasTap) === 'undefined') {
    // eslint-disable-next-line no-eval
    eval(UrlFetchApp.fetch('https://raw.githubusercontent.com/zixia/gast/master/src/gas-tap-lib.js').getContentText());
  }

  if (typeof customLogger !== 'function') {
    // For logging test results on GCP
    return new GasTap();
  }

  // For responding test results to API call
  return new GasTap({
    logger: loggerAPI,
  });
}

/**
 * Run test
 * @param {test} GasT object
 * @param {config} Config object
 * `param {testCase} Test contents object
 */
function run(test, config, testCase) {
  test(testCase.name, (t) => {
    if (testCase.skip) {
      return;
    }

    const output = testCase.func(config.deployment, config.apiKey, ...testCase.args);
    const numRow = output.length;
    const numCol = output[0].length;

    // Write on test sheet
    config.sheet.clearContents();
    config.sheet.getRange(1, 1, numRow, numCol).setValues(output);
    SpreadsheetApp.flush();

    const actualSheet = config.sheet.getRange(1, 1, numRow, numCol).getValues();
    t.deepEqual(actualSheet, testCase.expected, 'data in the sheet should be same');

    config.sheet.clearContents();
  });
}

/**
 * Called from outside to run tests and return test results
 */
// eslint-disable-next-line no-unused-vars
function testRunner() {
  const test = initTest(loggerAPI);
  const testSheetURL = 'https://docs.google.com/spreadsheets/d/12jQjyXkqUooDK5wlDyazBa3xZb5NVa-YyixNtTRZIsI/edit#gid=0';
  const ss = SpreadsheetApp.openByUrl(testSheetURL);
  SpreadsheetApp.setActiveSpreadsheet(ss);

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Config');
  const config = {
    deployment: sheet.getRange('B1').getValue(),
    apiKey: sheet.getRange('B2').getValue(),
    sheet: SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Test'),
  };
  const testCases = [
    {
      name: 'TestMBADDRESS',
      skip: false,
      func: MBADDRESS,
      args: ['0x0000000000000012340000000000000000000000'],
      expected: [
        ['label', 'address', 'balance', 'chain', 'isContract', 'modules', 'contracts'],
        ['', '0x0000000000000012340000000000000000000000', '0', 'ethereum', false, '', ''],
      ],
    },
    {
      name: 'TestMBBLOCK',
      skip: false,
      func: MBBLOCK,
      args: [1],
      expected: [
        ['blockchain', 'hash', 'difficulty', 'gasLimit', 'number', 'timestamp', 'receipt', 'txHashes'],
        ['ethereum', '0x8e38b4dbf6b11fcc3b9dee84fb7986e29ca0a02cecd8977c161ff7333329681e', 12549332509227, 3141592, 1000000, '2016-02-13T22:54:13.000Z', '0x20e3534540caf16378e6e86a2bf1236d9f876d3218fbc03958e6db1c634b2333', '0xea1093d492a1dcb1bef708f771a99a96ff05dcab81ca76c31940300177fcf49f,0xe9e91f1ee4b56c0df2e9f06c2b8c27c6076195a88a7b8537ba8313d80e6f124e'],
      ],
    },
    {
      name: 'TestMBCOMPOSE',
      skip: false,
      func: MBCOMPOSE,
      args: [],
      expected: {
        from: '0xfa49187F19edeEb7df7868Db82F2D723440B6C6E', to: '0x775E90a06A3D908940eC326924262b37943Aa140', value: '0', gas: 78572, gasPrice: '18200000000', data: '0xd32bfb6c00000000000000000000000000000000000000000000000000000000000000ec', nonce: 11, hash: '0xf662f76728c8e6cbaa011a189b87f43236f0884653635158dc6a47cc7fcf3c6e',
      },
    },
    {
      name: 'TestMBCUSTOMQUERY',
      skip: true,
      func: MBCUSTOMQUERY,
      args: [],
      expected: [],
    },
    {
      name: 'TestMBCUSTOMQUERYTEMPLATE',
      skip: true,
      func: MBCUSTOMQUERYTEMPLATE,
      args: [],
      expected: [],
    },
    {
      name: 'TestMBEVENTLIST',
      skip: false,
      func: MBEVENTLIST,
      args: ['publiclock'],
      expected: [
        ['event', 'description', 'inputs'], ['Approval', '', '3 inputs:\nowner address\napproved address\ntokenId uint256'],
        ['ApprovalForAll', '', '3 inputs:\nowner address\noperator address\napproved bool'], ['CancelKey', '', '4 inputs:\ntokenId uint256\nowner address\nsendTo address\nrefund uint256'], ['Disable', '', 'no inputs'], ['ExpirationChanged', '', '3 inputs:\n_tokenId uint256\n_amount uint256\n_timeAdded bool'], ['ExpireKey', '', '1 input:\ntokenId uint256'], ['KeyGranterAdded', '', '1 input:\naccount address'], ['KeyGranterRemoved', '', '1 input:\naccount address'], ['KeyManagerChanged', '', '2 inputs:\n_tokenId uint256\n_newManager address'], ['LockManagerAdded', '', '1 input:\naccount address'], ['LockManagerRemoved', '', '1 input:\naccount address'], ['NewLockSymbol', '', '1 input:\nsymbol string'], ['NonceChanged', '', '2 inputs:\nkeyManager address\nnextAvailableNonce uint256'], ['PricingChanged', '', '4 inputs:\noldKeyPrice uint256\nkeyPrice uint256\noldTokenAddress address\ntokenAddress address'], ['RefundPenaltyChanged', '', '2 inputs:\nfreeTrialLength uint256\nrefundPenaltyBasisPoints uint256'], ['RenewKeyPurchase', '', '2 inputs:\nowner address\nnewExpiration uint256'], ['Transfer', '', '3 inputs:\nfrom address\nto address\ntokenId uint256'], ['TransferFeeChanged', '', '1 input:\ntransferFeeBasisPoints uint256'], ['Withdrawal', '', '4 inputs:\nsender address\ntokenAddress address\nbeneficiary address\namount uint256']
      ],
    },
    {
      name: 'TestMBEVENTS',
      skip: true,
      func: MBEVENTS,
      args: [],
      expected: [],
    },
    {
      name: 'TestMBFUNCTIONLIST',
      skip: false,
      func: MBFUNCTIONLIST,
      args: ['erc20interface'],
      expected: [
        ['function', 'description', 'read/write', 'inputs', 'outputs'], ['allowance', '', 'read', '2 inputs:\ntokenOwner address\nspender address', '1 output:\nremaining uint256'], ['approve', '', 'write', '2 inputs:\nspender address\ntokens uint256', '1 output:\nsuccess bool'], ['balanceOf', '', 'read', '1 input:\ntokenOwner address', '1 output:\nbalance uint256'], ['decimals', '', 'read', 'no inputs', '1 output:\nuint8'], ['name', '', 'read', 'no inputs', '1 output:\nstring'], ['symbol', '', 'read', 'no inputs', '1 output:\nstring'], ['totalSupply', '', 'read', 'no inputs', '1 output:\nuint256'], ['transfer', '', 'write', '2 inputs:\nto address\ntokens uint256', '1 output:\nsuccess bool'],
        ['transferFrom', '', 'write', '3 inputs:\nfrom address\nto address\ntokens uint256', '1 output:\nsuccess bool'],
      ],
    },
    {
      name: 'TestMBGET',
      skip: true,
      func: MBGET,
      args: [],
      expected: [],
    },
    {
      name: 'TestMBPOSTTEMPLATE',
      skip: true,
      func: MBPOSTTEMPLATE,
      args: [],
      expected: [],
    },
    {
      name: 'TestMBQUERY',
      skip: false,
      func: MBQUERY,
      args: ['Queued Exits', 5],
      expected: [
        ['exitid', 'priority'],
        ['666629079848833945283516969712032889240528132', '41733475565687827013448321883143303337820997464902624318864041623172916484'],
        ['1401973687505857731830456287637471880977785047', '41751861880721805686398941946704262444111373862207383147640349032816517335'],
        ['2054345912177215402617314954546801559724193123', '41752026299537173367456859727492207583157445734862728631688173641164748131'],
        ['12018136374180221520320355170630020014075267311', '41753870186123925948850253652650103648140958609936382295744042661855611119'],
        ['1805958224368381604189476822833232573913333196', '41755646356907136232573277651225957746239350543415473449459681295463054796'],
      ],
    },
    {
      name: 'TestMBTX',
      skip: false,
      func: MBTX,
      args: [],
      expected: [
        ['isPending', 'nonce', 'gasPrice', 'gas', 'to', 'value', 'input', 'v', 'r', 's', 'hash'],
        [false, 1, 11000000000, 44058, '0x6b175474e89094c44da98b954eedeac495271d0f', 0, '0x095ea7b3000000000000000000000000775e90a06a3d908940ec326924262b37943aa140000000000000000000000000000000000000000000000002b5e3af16b1880000', '0x26', '0x1fb7f40f50154e7e4031dc4f907d20b86e223f6b0896f6cf7a7c5248785f444c', '0x729c238805a51a6c1a13ab7d1397539b8d5f2e3127a2e33cf61d32d78ec02dc', '0xb01683f3057c1ecb63524edeb1f138b9ec15ebd8c15e10fbac7e39f14f85a54f'],
      ],
    },
  ];

  // TODO: cover internal functions
  // https://github.com/curvegrid/hackathon-sunset-supreme/issues/5

  // eslint-disable-next-line no-restricted-syntax
  for (const testCase of testCases) {
    run(test, config, testCase);
  }

  test.finish();

  return { failures: test.totalFailed(), log: loggerAPI() };
}
