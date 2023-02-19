const TelegramApi = require('node-telegram-bot-api')
const axios = require('axios');
const request = require('request')

const token = '5729974955:AAFAK-WSesmjYoN9xq0-k3jdnS6Pqq-9Jh4'
const bot = new TelegramApi(token, {polling: true})

const {gameOptions, againOptions} = require('./options')
const chats = {}

const startGame = async (chatId) => {
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
        arrResult[i] = Math.floor((buyMain * pr_Main_USDT) * 100) / 100;

        if (arrResult[i] >= 1.01) {
            // pri(mainCoin, arrResult[i], arrUSDT[i]['symbol'], prCoin_USDT, prCoin_Main, pr_Main_USDT)
            if (arrResult[i] >= 1.03) {
                arrCoin.push(`\nUSDT -> ${arrUSDT[i]['baseAsset']} -> ${mainCoin} -> USDT (result: ${arrResult[i]})\n`);
                // message += `<i>${arrUSDT[i]['symbol']} -> ${arrResult[i]}, ${mainCoin}</i>\n`
                arrPrice.push(`Buy: ${prCoin_USDT} => ${prCoin_Main} => ${pr_Main_USDT}\n`)
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
        arrResult[i] = Math.floor((buyMain * pr_Main_USDT) * 100) / 100;
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
                    } else {
                        flag = true;
                    }
                }
                if (flag) {
                    prev = arrCoin;
                    message += "Binance\n";
                    for (let i = 0; i < arrCoin.length; i++) {
                        message += arrCoin[i];
                        message += arrPrice[i];
                    }
                    return bot.sendMessage(chatId, message, calculative(chatId, check_stop));
                } else {
                    return calculative(chatId, check_stop);

                }

            }, 300000)
        })
    });
}
bot.onText(/\/echo (.+)/, (msg, match) => {
    // bot.sendMessage()
    console.log(match)

})
const start = () => {
    bot.setMyCommands([
        {command: '/start', description: 'start'},
        {command: '/info', description: 'info'},
        {command: '/game', description: 'info'},
        {command: '/calc', description: 'calc'},
        {command: '/price', description: 'pinPrice'},

    ])

    const chatIdOfGroup = -1001869234502;
    check_stop = true;
    calculative(chatIdOfGroup, check_stop);

    bot.on('message', msg => {
        const text = msg.text;
        const chatId = msg.chat.id;
        const msgId = msg.message_id;
        // console.log(msg);
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

        if (text === '/price') {
            bot.sendMessage(chatId, 'Виберіть час для таймера', {
                reply_markup: {
                    keyboard: [
                        ['5 хв', '15 хв'],
                        ['30 хв', '1 год'],
                        ['4 год', '8 год'],
                        ['12 год', '24 год'],
                    ],
                    one_time_keyboard: true,
                },
            })
            bot.once('message', (timeMsg) => {
                let time = 0;
                switch (timeMsg.text) {
                    case '5 хв':
                        time = 5 * 60 * 1000;
                        break;
                    case '15 хв':
                        time = 5 * 60 * 1000;
                        break;
                    case '30 хв':
                        time = 30 * 60 * 1000;
                        break;
                    case '1 год':
                        time = 60 * 60 * 1000;
                        break;
                    case '4 год':
                        time = 4 * 60 * 60 * 1000;
                        break;
                    case '8 год':
                        time = 8 * 60 * 60 * 1000;
                        break;
                    case '12 год':
                        time = 12 * 60 * 60 * 1000;
                        break;
                    case '24 год':
                        time = 24 * 60 * 60 * 1000;
                        break;
                    default:
                        bot.sendMessage(chatId, 'Потрібно вибрати час зі списку, спробуйте почати все спочатку')
                        return;
                }
                // bot.sendMessage(chatId, `Таймер буде встановлено на ${time}`);


                // Відправлення повідомлення з запитом на введення
                bot.sendMessage(chatId, 'Яку монету ви хочете обрати?');

                // Очікування відповіді від користувача
                bot.once('message', (coinMsg) => {
                    const coin = coinMsg.text.toUpperCase();
                    const coinPriceUrl = `https://fapi.binance.com/fapi/v1/ticker/price?symbol=${coin}`;
                    request.get(coinPriceUrl, (error, response, body) => {
                        if (!error && response.statusCode === 200) {
                            bot.sendMessage(chatId, 'Введіть ціну, будь ласка.');
                            bot.once('message', (priceMsg) => {
                                const price = parseFloat(priceMsg.text);
                                if (isNaN(price)) {
                                    bot.sendMessage(chatId, 'Введіть дійсне число!');
                                    return;
                                }

                                const currentPrice = parseFloat(JSON.parse(body).price);
                                let priceIsHightThenCurr;
                                if (price >= currentPrice) {
                                    priceIsHightThenCurr = true;
                                } else {
                                    priceIsHightThenCurr = false;
                                }
                                console.log("stat " + priceIsHightThenCurr + " curr " + currentPrice);
                                const timer = setTimeout(() => {
                                    clearInterval(intervalId);
                                    bot.sendMessage(chatId, `Час вичерпано, ціна ${coin} не досягла ${price}`)
                                }, time);
                                if (priceIsHightThenCurr) {
                                    bot.sendMessage(chatId, `Відстежуємо ціну ${coin} поки не стане більшою за ${price} протягом ${timeMsg.text}`);
                                }else {
                                    bot.sendMessage(chatId, `Відстежуємо ціну ${coin} поки не стане меньшою за ${price} протягом ${timeMsg.text}`);
                                }
                                const intervalId = setInterval(() => {
                                    request.get(coinPriceUrl, (error, resp, body) => {
                                        const currentPrice = parseFloat(JSON.parse(body).price);
                                        // console.log(currentPrice)
                                        if (priceIsHightThenCurr) {
                                            if (currentPrice >= price) {
                                                bot.sendMessage(chatId, `Ціна  ${coin} досягла ${price}`);
                                                clearInterval(intervalId);
                                                clearTimeout(timer);
                                            }
                                        } else {
                                            if (currentPrice <= price) {
                                                bot.sendMessage(chatId, `Ціна  ${coin} досягла ${price}`);
                                                clearInterval(intervalId);
                                                clearTimeout(timer);
                                            }
                                        }
                                    });
                                }, 10000);
                            })
                        } else {
                            // console.log(error)
                            bot.sendMessage(chatId, 'Щось пішло не так');
                        }
                    })
                });
            });
            return;

        }
        // return bot.sendMessage(chatId, 'bla bla')

    })
    bot.on('callback_query', msg => {
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
