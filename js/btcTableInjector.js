// add flag to avoid injecting the same code
if (!window.isBtcTableLoaded) {

    // variables
    window.isBtcTableLoaded = true;
    let bodyPriceNotice = "control-2323-btcornejo";
    let dynamicPositionKey = "element-position-2323-btcornejo";
    let css = "border: 1px #FCEAD3 solid;" +
        "display: inline-block;" +
        "position: fixed;" +
        "z-index: 100000;" +
        "cursor:move;" +
        "top: 0;" +
        "left: 0;" +
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

    // adding elements to body
    let bodyPriceNoticeElement = document.createElement("div");
    let internalSpanContainer = document.createElement("span");


    // price container
    bodyPriceNoticeElement.setAttribute("id", bodyPriceNotice);
    bodyPriceNoticeElement.setAttribute("draggable", "true");
    bodyPriceNoticeElement.setAttribute("style", css);
    bodyPriceNoticeElement.setAttribute("class", "mary-dany-btc-table");

    // price text element
    internalSpanContainer.innerText = "loading...";

    // appending elements
    bodyPriceNoticeElement.appendChild(internalSpanContainer);
    document.body.appendChild(bodyPriceNoticeElement);

    // adding position to main container

    function PositionHelper(bodyPriceNoticeElement) {

        var setElementPosition = function(dynamicPosition) {
            if (dynamicPosition.x < 0 || dynamicPosition.x > window.innerWidth ||
                dynamicPosition.y < 0 ||
                dynamicPosition.y > window.innerHeight) {
                return;
            }
            bodyPriceNoticeElement.style.left = dynamicPosition.x + "px";
            bodyPriceNoticeElement.style.top = dynamicPosition.y + "px";
        };

        var calcPosition = function(x, y) {
            return {
                y: y,
                x: x
            };
        };

        this.applySavedPosition = function() {
            browser.storage.sync.get("position").then(function(dynamicPosition) {
                setElementPosition(dynamicPosition.position);
            }, function(error) {
                setElementPosition(calcPosition(0, 0));
            });
        };

        this.savePosition = function(dynamicPosition) {
            browser.storage.sync.set({
                "position": dynamicPosition
            });
        };

        this.applyAndSavePosition = function(x, y) {
            let dto = calcPosition(x, y);
            this.savePosition(dto);
            setElementPosition(dto);
        };
    }

    // first time position, reading from storage
    let positionHelper = new PositionHelper(bodyPriceNoticeElement);
    // apply default position to container
    positionHelper.applySavedPosition();

    // add document body
    bodyPriceNoticeElement.addEventListener("dragend", function(e) {
        let startingPoint = parseInt(e.dataTransfer.getData("startingPoint"));
        let currentYPosition = e.target.offsetTop + (e.screenY - startingPoint);
        let currentXPosition = e.screenX - 60;
        positionHelper.applyAndSavePosition(currentXPosition, currentYPosition);
    });

    // add document body
    bodyPriceNoticeElement.addEventListener("dragstart", function(e) {
        e.dataTransfer.setData('startingPoint', e.screenY);
    });


    // lets add a listener to catch new messages coming from background scripts
    browser.runtime.onMessage.addListener(request => {
        let price = parseFloat(request.buy["price"]);
        let coinPriceStr = price.toLocaleString('en-US');
        internalSpanContainer.innerText = coinPriceStr + " " + request.secondaryCoin;
        return Promise.resolve(request);
    });

}