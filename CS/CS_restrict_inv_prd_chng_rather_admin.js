/**
*@NApiVersion 2.1
*@NScriptType ClientScript
*/
define(['N/runtime', "N/currentRecord", "N/search", "N/record"],
    function (runtime, currentRecord, search, record) {
        //Posting period record closed?
        var allowSaving = true;
        function fieldChanged(context) {
            var newRec = context.currentRecord;
            var id = context.fieldId
            if (id == 'trandate') {
                //Check for role is Admin
                var postinPeriodRecID = newRec.getValue({ fieldId: "postingperiod" });
                var postinPeriod = (newRec.getText({ fieldId: "postingperiod" })).split(" ");
                var postingPeriodMonth = postinPeriod[0]
                var postingPeriodYear = parseInt(postinPeriod[1])
                var trandate = newRec.getValue({ fieldId: "trandate" });
                var month = new Date(trandate).getMonth();
                var fullYear = parseInt(new Date(trandate).getFullYear());

                log.debug("postinPeriodRecID :  ", postinPeriodRecID)
                log.debug("postingPeriodMonth :  ", postingPeriodMonth)
                log.debug("postingPeriodYear :  ", postingPeriodYear)
                log.debug("trandate :  ", trandate)
                log.debug("month :  ", month + 1)
                log.debug("fullYear :  ", fullYear)
                var postingPeriodFields = search.lookupFields({
                    type: "accountingperiod",
                    id: postinPeriodRecID,
                    columns: ['closed']
                });

                log.debug("Posting period closed? :  ", postingPeriodFields.closed);

                const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

                var currentRole = runtime.getCurrentUser().role;
                log.debug("currentRole : ", currentRole)

                if (parseInt(currentRole) == 3) {
                    log.debug("Your Role Is admin You Can Edit :  ")
                    allowSaving = true
                } else {
                    if (postingPeriodFields.closed) {
                        log.debug("Posting Period Is Open You Can Edit :  ")
                        allowSaving = true
                    } else {
                        if (String(postingPeriodMonth) == months[month] && postingPeriodYear == fullYear) {
                            log.debug("Posting Period Is Of Same Month You Can Edit :  ")
                            allowSaving = true
                        } else {
                            window.alert("The date is in closed period, please select correct date")
                            allowSaving = false
                        }
                    }
                }

            }
        }

        function saveRecord(context) {
            log.debug("allowSaving : ", allowSaving)

            if (allowSaving) {
                return true
            } else {
                window.alert("The date is in closed period, please select correct date")
                return false
            };

        }

        return {
            fieldChanged: fieldChanged,
            saveRecord: saveRecord
        };
    });


