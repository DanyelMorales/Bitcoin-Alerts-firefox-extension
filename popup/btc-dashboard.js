$(document).ready(function() {
    // element references
    let settingsForm = $("#settings-form");
    let submitBtn = settingsForm.find("button[type=submit]");
    let resetBtn = settingsForm.find("button[type=reset]");
    let currencyConversion = settingsForm.find("#currency-conversion");
    let alertOverAmount = settingsForm.find("#alert-over-amount");
    let alertUnderAmount = settingsForm.find("#alert-under-amount");
    let alertOnAmount = settingsForm.find("#alert-on-amount");
    let alertOnMinutes = settingsForm.find("#alarm-on-minutes");

    // Form validation
    settingsForm.validate({
        errorPlacement: function(error, element) {},
        highlight: function(element, errorClass, validClass) {
            console.log(errorClass);
            $(element).addClass(errorClass).removeClass(validClass);
            $(element.form).find("label[for=" + element.id + "]")
                .addClass(errorClass);
            submitBtn.attr("disabled", "disabled");
        },
        unhighlight: function(element, errorClass, validClass) {
            $(element).removeClass(errorClass).addClass(validClass);
            $(element.form).find("label[for=" + element.id + "]")
                .removeClass(errorClass);
            submitBtn.removeAttr("disabled");

        }
    });

    // read existing values from storage
    browser.storage.sync.get("settings").then(function(settings) {
        if (!settings || !settings.settings) {
            return;
        }
        currencyConversion.val(settings.settings.currencyConversion || "");
        alertOverAmount.val(settings.settings.alertOverAmount || "");
        alertUnderAmount.val(settings.settings.alertUnderAmount || "");
        alertOnAmount.val(settings.settings.alertOnAmount || "");
        alertOnMinutes.val(settings.settings.alertOnMinutes || "");
    }, null);

    // remove existing values from storage
    $(resetBtn).click(function(e) {
        e.preventDefault();
        browser.storage.sync.remove("settings").then(
            function() {
                submitBtn.attr("disabled", "disabled");
                //currencyConversion.val();
                alertOverAmount.val("");
                alertUnderAmount.val("");
                alertOnAmount.val("");
                alertOnMinutes.val("");
            }
        );
    });

    // save values to storage
    $(submitBtn).click(function(e) {
        e.preventDefault();
        browser.storage.sync.set({
            "settings": {
                currencyConversion: currencyConversion.find("option:selected").val(),
                alertOverAmount: alertOverAmount.val(),
                alertUnderAmount: alertUnderAmount.val(),
                alertOnAmount: alertOnAmount.val(),
                alertOnMinutes: alertOnMinutes.val(),
            }
        });
    });
});

// todo: add notifications when saving is done