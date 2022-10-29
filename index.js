const TelegramApi = require('node-telegram-bot-api')
const axios = require('axios');

const token = '5729974955:AAFAK-WSesmjYoN9xq0-k3jdnS6Pqq-9Jh4'
const bot = new TelegramApi(token, {polling: true})

const {gameOptions, againOptions} = require('./options')
const chats = {}

const startGame = async (chatId) => {
    await bot.sendMessage(chatId, '0-9')
    const randNum = Math.floor(Math.random() * 10)
    chats[chatId] = randNum;
    await bot.sendMessage(chatId, 'Choose 0-9', gameOptions)
}
let message = '';
let prev = [];
let check_stop;
let arrCoin = [];
let arrPrice = [];


function buy_buy_sell_USDT(arrKey, arrUSDT, mainCoin) {
    // addP("USDT", mainCoin);
    let arrResult = [];
    let pr_Main_USDT;
    if (arrKey[mainCoin + '_USDT']) {
        pr_Main_USDT = arrKey[mainCoin + '_USDT']['price'];
    } else {
        if (arrKey['USDT_' + mainCoin]) {
            pr_Main_USDT = arrKey['USDT_' + mainCoin]['price'];
        } else {
            console.log("not found " + mainCoin);
            return;
        }
    }
    for (let i = 0; i < arrUSDT.length; i++) {
        //елемент не равен гланой монете
        // debugger
        if (arrUSDT[i]['baseAsset'] === mainCoin) {
            continue
        }
        let prCoin_Main;
        //нету пары с главной монетой
        if (!arrKey[mainCoin + '_' + arrUSDT[i]['baseAsset']]) {
            continue
        }
        //проверка на трейдинг
        if (arrKey[mainCoin + '_' + arrUSDT[i]['baseAsset']]['status'] === "BREAK") {
            continue
        }
        prCoin_Main = arrKey[mainCoin + '_' + arrUSDT[i]['baseAsset']]['price'];

        let prCoin_USDT = arrKey[arrUSDT[i]['baseAsset'] + '_' + arrUSDT[i]['quoteAsset']]['price'];
        let buyCoin = (1 / prCoin_USDT).toFixed(8);
        let buyMain = (buyCoin / prCoin_Main).toFixed(8);
        // arrResult[i] = buyMain * pr_Main_USDT;
        arrResult[i] = Math.floor((buyMain * pr_Main_USDT)*100)/100;

        if (arrResult[i] >= 1.01) {
            pri(mainCoin, arrResult[i], arrUSDT[i]['symbol'], prCoin_USDT, prCoin_Main, pr_Main_USDT)
            if (arrResult[i] >= 1.03) {
                arrCoin.push( `\nUSDT -> ${arrUSDT[i]['baseAsset']} -> ${mainCoin} -> USDT (result: ${arrResult[i]})\n`);
                // message += `<i>${arrUSDT[i]['symbol']} -> ${arrResult[i]}, ${mainCoin}</i>\n`
                 arrPrice.push( `Buy: ${prCoin_USDT} => ${prCoin_Main} => ${pr_Main_USDT}\n`)
            }
        }
    }
    // console.log(arrResult);

}
function buy_sell_sell_USDT(arrKey, arrUSDT, mainCoin) {
    let arrResult = [];
    let pr_Main_USDT
    if (arrKey[mainCoin + '_USDT']) {
        pr_Main_USDT = arrKey[mainCoin + '_USDT']['price'];
    } else {
        if (arrKey['USDT_' + mainCoin]) {
            pr_Main_USDT = arrKey['USDT_' + mainCoin]['price'];
        } else {
            console.log("not found " + mainCoin);
            return;
        }
    }
    for (let i = 0; i < arrUSDT.length; i++) {
        if (arrUSDT[i]['baseAsset'] === mainCoin) {
            continue
        }
        let prCoin_Main;
        if (!arrKey[arrUSDT[i]['baseAsset'] + '_' + mainCoin]) {
            continue
        }

        if (arrKey[arrUSDT[i]['baseAsset'] + '_' + mainCoin]['status'] === "BREAK") {
            continue
        }
        prCoin_Main = arrKey[arrUSDT[i]['baseAsset'] + '_' + mainCoin]['price'];

        let prCoin_USDT = arrKey[arrUSDT[i]['baseAsset'] + '_' + arrUSDT[i]['quoteAsset']]['price'];
        let buyCoin = (1 / prCoin_USDT).toFixed(8);
        let buyMain = (buyCoin * prCoin_Main).toFixed(8);
        // arrResult[i] = (buyMain * pr_Main_USDT).toFixed(2);
        arrResult[i] = Math.floor((buyMain * pr_Main_USDT)*100)/100;
        if (arrResult[i] >= 1.01) {
            if (arrResult[i] >= 1.03) {
                arrCoin.push(`\nUSDT -> ${arrUSDT[i]['baseAsset']} -> ${mainCoin} -> USDT (result: ${arrResult[i]})\n`);
                arrPrice.push(`Buy: ${prCoin_USDT} => ${prCoin_Main} => ${pr_Main_USDT}\n`);
            }
        }
    }
}

const calculative = async (chatId, check_stop) => {
    // if (check_stop) {
    bot.on('message', async msg => {
        const text = msg.text;
        if (text === '/stop') {
            check_stop = false;
        }
    })
    axios({
        method: 'GET',
        url: "https://api.binance.com/api/v3/exchangeInfo",
        timeout: 0,
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
    }).then(function (response) {
        let arrKey = response.data['symbols'];
        message = '';
        arrCoin = [];
        arrPrice = [];
        let arrUSDT = [];
        let usdt = 0;
        for (let i = 0; i < arrKey.length; i++) {
            if (arrKey[i]['quoteAsset'] === 'USDT' && arrKey[i]['status'] !== "BREAK") {
                arrUSDT[usdt] = arrKey[i];
                usdt++;
            }
        }
        let pr;
        axios({
            method: 'GET',
            url: "https://api3.binance.com/api/v3/ticker/price",
            timeout: 0,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
        }).then(function (response) {
            pr = response.data;
            pr = pr.reduce(function (arr, val) {
                arr[val.symbol] = {"price": val.price};
                return arr
            }, {});

            arrKey = arrKey.reduce(function (arr, val) {
                arr[`${val.baseAsset}_${val.quoteAsset}`] = {...val, ...pr[val.symbol]};

                return arr
            }, {});
            buy_sell_sell_USDT(arrKey, arrUSDT, 'BTC');
            buy_sell_sell_USDT(arrKey, arrUSDT, 'ETH');
            buy_sell_sell_USDT(arrKey, arrUSDT, 'EUR');
            buy_sell_sell_USDT(arrKey, arrUSDT, 'GBP');

            //mainCoin/coin
            buy_buy_sell_USDT(arrKey, arrUSDT, 'LTC');
            buy_buy_sell_USDT(arrKey, arrUSDT, 'XRP');
            buy_buy_sell_USDT(arrKey, arrUSDT, 'ADA');
            buy_buy_sell_USDT(arrKey, arrUSDT, 'ETC');

            setTimeout(function () {
                message = '';
                let flag = false;
                if (arrCoin.length > 0) {
                    if (prev.length === arrCoin.length) {
                        for (let i = 0; i < arrCoin.length; i++) {
                            if (prev[i] !== arrCoin[i]) {
                                flag = true
                                break
                            }
                        }
                    }else {
                        flag = true;
                    }
                }
                if (flag) {
                    prev = arrCoin;
                    for (let i = 0; i < arrCoin.length; i++) {
                        message += arrCoin[i];
                        message += arrPrice[i];
                    }
                    return bot.sendMessage(chatId, message, calculative(chatId, check_stop));
                } else {
                    return calculative(chatId, check_stop);

                }

            }, 60000)
        })
    });
}
bot.onText(/\/ech0 (.+)/, (msg) => {
    console.log(msg)

})
const start = () => {
    bot.setMyCommands([
        {command: '/start', description: 'start'},
        {command: '/info', description: 'info'},
        {command: '/game', description: 'info'},
        {command: '/calc', description: 'calc'},

    ])

    const chatId = -1001869234502;
    check_stop = true;
    calculative(chatId, check_stop);

    bot.on('message', async msg => {
        const text = msg.text;
        const chatId = msg.chat.id;
        console.log(chatId);
        let check_stop = false;
        if (text === '/start') {
            return bot.sendMessage(chatId, 'Hello, I`m Enot ');
        }
        if (text === '/info') {
            return bot.sendMessage(chatId, `You ${msg.from.username}`);
        }
        if (text === '/game') {
            return startGame(chatId)
        }
        if (text === '/calc' || text === '/stop') {
            if (text === '/stop') {
                check_stop = false
            } else {
                check_stop = true
            }
            let i = 0;

            return
        }
        return bot.sendMessage(chatId, 'bla bla')

    })
    bot.on('callback_query', async msg => {
        const data = msg.data;
        const chartId = msg.message.chat.id;
        if (data === '/again') {
            return startGame(chartId)
        }
        if (data == chats[chartId]) {
            return bot.sendMessage(chartId, `🎉 You win 🎉 \n Enot choose ${chats[chartId]}`, againOptions)
        } else {
            return bot.sendMessage(chartId, `😢 You lose 😢 \n Enot choose ${chats[chartId]}`, againOptions)
        }

    })
}
start()
