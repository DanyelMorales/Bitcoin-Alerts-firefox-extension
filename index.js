let localStorageID = '_MARCORSOL_PRICE-BTC_';

// MAIN CONFIGURATION
let config = {
    primaryCoin: 'btc',
    limit: 2,
    secondaryCoin: 'mxn',
    type: 'trades',
    wsURI: 'wss://ws.bitso.com',
    baseURL: function() {
        return 'https://api.bitso.com/v3/' + this.type + '/';
    },
    getBook: function() {
        return this.primaryCoin + '_' + this.secondaryCoin;
    },
    getEndpoint: function() {

        return this.baseURL() + '?book=' + this.getBook() + '&limit=' + this.limit;
    },
    applySettings: function(settings) {
        if (settings && typeof settings.currencyConversion !== 'undefined') {
            this.secondaryCoin = settings.currencyConversion;
        }
    }
};

// UTILS
let showNotification = function(title, body) {
    browser.notifications.create("btc-notification", {
        "type": "basic",
        "iconUrl": browser.runtime.getURL("icons/btc-72x72.png"),
        "title": title,
        "message": body
    });
};


// SettingsHandler
let BtcNotificationDelegator = function(rules) {
    let settings = {};
    let priceRules = rules || {};
    let dispatchChanges = function(price) {
        if (settings && Object.keys(settings).length === 0) {
            return;
        }
        for (let setting in settings) {
            if (typeof priceRules[setting] !== 'undefined' && settings[setting]) {
                (priceRules[setting]).call(settings, price, settings[setting]);
            }
        }
    };
    this.applySettings = function(cfgs) {
        settings = cfgs;
    };
    this.delegate = function(data) {
        if (!data || !data.buy || !data.buy.price) {
            return;
        }
        dispatchChanges(data.buy.price);
    };
};

let BtcAlarmDelegator = function() {
    let alarmName = "btc-alarm";
    let currentPrice = null;

    let onBtcAlarm = function(info) {
        if (!currentPrice) {
            return;
        }
        showNotification("Btc value right now ", currentPrice);
    };

    let createAlarm = function(alarmName, minutes) {
        browser.alarms.create(alarmName, {
            delayInMinutes: 0,
            periodInMinutes: minutes
        });

        browser.alarms.onAlarm.addListener(function(info) {
            if (info.name !== alarmName) {
                return;
            }
            onBtcAlarm(info);
        });
    };


    this.applySettings = function(settings) {
        if (settings && typeof settings.alertOnMinutes !== 'undefined') {
            let helper = function() { createAlarm.apply(alarmName, [settings.alertOnMinutes]) };
            browser.alarms.clear(alarmName).then(helper, helper);
        } else {
            browser.alarms.clear(alarmName);
        }
    }

    this.delegate = function(data) {
        if (!data || !data.buy || !data.buy.price) {
            return;
        }
        this.currentPrice = data.buy.price;
    };
};

let SettingHandlerManager = function(settingsHandler) {
    let handlers = settingsHandler || {};
    this.applySettings = function(settings) {
        if (!handlers) {
            return;
        }
        for (let handler in handlers) {
            (handlers[handler]).applySettings(settings);
        }
    };

    this.getHandler = function(name) {
        return handlers[name] || null;
    };
};

// SettingsHandler usage

let btcNotification = new BtcNotificationDelegator({
    alertOnAmount: function(currentPrice, expectedPrice) {
        if (currentPrice == expectedPrice) {
            showNotification("Btc price", "Price on " + expectedPrice + "  => Now " + currentPrice);
        }
    },
    alertOverAmount: function(currentPrice, expectedPrice) {
        if (currentPrice > expectedPrice) {
            showNotification("Btc price", "Price greater than " + expectedPrice + "  => Now " + currentPrice);
        }
    },
    alertUnderAmount: function(currentPrice, expectedPrice) {
        if (currentPrice < expectedPrice) {
            showNotification("Btc price", "Price below " + expectedPrice + "  => Now " + currentPrice);
        }
    }
});

let btcAlarmDelegator = new BtcAlarmDelegator();

let settingHandlerManager = new SettingHandlerManager({
    "btcNotification": btcNotification,
    "btcAlarmDelegator": btcAlarmDelegator,
    "config": config
});


// UPDATING BTC UI INFORMATION
let UIHandler = function(delegators) {
    this.updatePrice = function(price) {
        for (const key of delegators) {
            key.delegate(price);
        }
    };
};

let UIBadgeDelegator = function() {
    this.delegate = function(data) {
        if (typeof data !== 'undefined') {
            // set badge
            browser.browserAction.setBadgeText({
                text: data.buy.price
            });
            browser.browserAction.setBadgeBackgroundColor({
                color: "green"
            });

        }
    };
}

let UIHTMLDelegator = function() {

    let data = {};
    let messageTab = function(tabs) {
        for (let tab of tabs) {
            browser.tabs.sendMessage(tab.id, data);
        }
    }

    let onExecuted = function(result) {
        let querying = browser.tabs.query({
            currentWindow: true
        });
        querying.then(messageTab);
    };

    this.delegate = function(price) {
        data = price;
        let executing = browser.tabs.executeScript({
            file: "js/btcTableInjector.js"
        });
        executing.then(onExecuted);
    };
}


let StorageDelegator = function() {
    this.delegate = function(price) {
        localStorage.setItem(localStorageID, JSON.stringify(price));
    };
};



//  DTO for exchange information
let BuildDTO = function() {
    let getBaseDTO = function(configuration) {
        return {
            secondaryCoin: configuration.secondaryCoin.toUpperCase(),
            buy: {},
            sell: {}
        };
    };

    this.build = function(data, configuration) {
        const result = getBaseDTO(configuration);
        let subData = data.slice(0, 2);
        if (subData[0].maker_side === 'sell') {
            result.sell = subData[0];
            result.buy = subData[1];
        } else {
            result.sell = subData[1];
            result.buy = subData[0];
        }
        return result;
    };

    this.buildWS = function(data, configuration) {
        const result = getBaseDTO(configuration);
        result.sell = data;
        result.buy = data;
        return result;
    };
};

// RETRIEVING BITCOIN INFORMATION
let BitsoProviderWS = function(uiHandler, configuration) {
    let buildDTO = new BuildDTO();

    this.run = function() {
        var websocket = new WebSocket(configuration.wsURI);
        websocket.onopen = function() {
            websocket.send(JSON.stringify({ action: 'subscribe', book: configuration.getBook(), type: configuration.type }));
        };
        websocket.onmessage = function(message) {
            var data = JSON.parse(message.data);
            if (data.type == 'trades' && data.payload) {
                var payload = {
                    "book": data.book,
                    "maker_side": "sell",
                    "price": data.payload[0].r,
                };
                let dto = buildDTO.buildWS(payload, configuration);
                uiHandler.updatePrice(dto);
            }
        };

        websocket.onclose(function() {
            console.log("desconectado......");
        });
    };
};
let BitsoProvider = function(uiHandler, configuration) {

    let httpRequest = new XMLHttpRequest();
    let buildDTO = new BuildDTO();

    httpRequest.onreadystatechange = function(data) {
        if (httpRequest.readyState !== XMLHttpRequest.DONE || httpRequest.status != 200) {
            return;
        }

        let responseObject = JSON.parse(httpRequest.responseText);
        if (!responseObject || !responseObject.success || !responseObject.payload) {
            return;
        }
        let dto = buildDTO.build(responseObject.payload, configuration);
        uiHandler.updatePrice(dto);
    };

    let retrieveBitsoInformationFn = function() {
        httpRequest.open('GET', configuration.getEndpoint(), true);
        httpRequest.send();
    };

    this.run = function(loop) {
        if (!window.XMLHttpRequest) {
            console.error("XMLHttpRequest not supported");
            return;
        }

        // execute operations
        if (loop) {
            setInterval(retrieveBitsoInformationFn, 2000);
        } else {
            retrieveBitsoInformationFn();
        }
    };


};

// ==============INIT==============

let htmlDelegator = new UIHTMLDelegator();
let uiHandler = new UIHandler([
    new UIBadgeDelegator(),
    htmlDelegator,
    new StorageDelegator(),
    btcNotification,
    btcAlarmDelegator
]);

//let provider = new BitsoProviderWS(uiHandler, config);

let boostrapProvider = new BitsoProvider(uiHandler, config);

// first execution
boostrapProvider.run(true);

// then we can just start listening on websocket port
//provider.run();

// handling setting updation
browser.storage.onChanged.addListener(function(changes, area) {
    if (area === "sync" && changes.settings) {
        if (changes.settings.newValue) {
            settingHandlerManager.applySettings(changes.settings.newValue);
        } else {
            settingHandlerManager.applySettings(null);
        }
    }
});

// Handling new tab loading
browser.tabs.onUpdated.addListener(function() {
    let data = localStorage.getItem(localStorageID);
    if (data !== null) {
        htmlDelegator.delegate(JSON.parse(data));
    }
});

// load settings saved on installation