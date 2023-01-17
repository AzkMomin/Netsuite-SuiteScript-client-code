/**
* @NApiVersion 2.x 
* @NScriptType ClientScript
*/
define(['N/currentRecord', 'N/record', 'N/url'],
    function (currentRecord, record, url) {
        function PageInIt(context) {
            log.debug("Page init : ");
            var currentRec = context.currentRecord;
            var custid = GetParameterFromURL("custId");
            // log.debug("json : " , json);
            log.debug("custid : ", custid);
        }
        /*  Open New Sales Order    */
        function createCopy(custId,JsonParentRecord) {
            try {
                if (window.confirm("Do you want to copy the customer?")) {
                    window.localStorage.setItem("JsonParentRecord", JSON.stringify(JsonParentRecord));
                    log.debug("custId : ", custId);
                    var dsURL = url.resolveTaskLink({
                        id: 'EDIT_CUSTJOB',
                        params: {

                        }
                    });

                    window.location.href = dsURL;
                    window.localStorage.setItem("JsonParentRecord", JSON.stringify(JsonParentRecord));
                }
                else {

                }
                // var url = "https://tstdrv2525421.app.netsuite.com/app/common/entity/custjob.nl?stage=customer&custId=" + custId
                // //Open Sales Order in new Tab
                // window.open(url, "_blank");

            }
            catch (e) {
                log.debug("error : ", e)
            }
            return true;
        }
        function fieldChanged(context) {
            log.debug('changed')
            return true
        }
        /* Get URL Parameter value using parameter */
        function GetParameterFromURL(param) {
            var obj;
            var query = window.location.search.substring(1);
            var vars = query.split("&");
            var pairs = vars[1].split("=");
            if (pairs[0] == param) {
                obj = pairs[1];
            }
            return obj;
        }
        return {
            pageInit: PageInIt,
            fieldChanged: fieldChanged,
            createCopy: createCopy
        };
    });
