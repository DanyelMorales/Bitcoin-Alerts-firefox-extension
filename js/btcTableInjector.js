// anadir flags para evitar reinsercion 
if (!window.isBtcTableLoaded) {
    window.isBtcTableLoaded = true;
    let css = "border: 1px #FCEAD3 solid;" +
        "display: inline-block;" +
        "position: fixed;" +
        "z-index: 100000;" +
        "bottom: 0;" +
        "right: 0;" +
        "height: 20px;" +
        "padding: 2px 10px 0px;" +
        "background-color: #F59413;" +
        "color: #fcead3;" +
        "border-radius: 37px 1px;" +
        "font-weight: 600;" +
        "text-shadow: 1px 1px #757373;" +
        "font-family: Roboto;" +
        "box-shadow: 0px 0px 1px 1px #fab560;" +
        "opacity:0.8;" +
        "font-size: 12px;";
    let icon = browser.runtime.getURL("icons/favicon-32x32.png");
    document.querySelector("body").insertAdjacentHTML("afterend",
        "<link href='https://fonts.googleapis.com/css2?family=Roboto:wght@300;400&display=swap' rel='stylesheet'/>" +
        "<div id='devtopocket_notification' style='" + css + "' class='mary-dany-btc-table'>" +
        "<span>loading...</span></div>");

    browser.runtime.onMessage.addListener(request => {
        let price = parseFloat(request.buy["price"]);
        let coinPriceStr = price.toLocaleString('en-US');
        document.querySelector("#devtopocket_notification span").textContent = coinPriceStr + " " + request.secondaryCoin;
        return Promise.resolve(request);
    });

}