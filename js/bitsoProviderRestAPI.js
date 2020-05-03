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

    this.run = function() {
        if (!window.XMLHttpRequest) {
            console.error("XMLHttpRequest not supported");
            return;
        }

        // execute operations
        setInterval(retrieveBitsoInformationFn, 1000);
    };


};