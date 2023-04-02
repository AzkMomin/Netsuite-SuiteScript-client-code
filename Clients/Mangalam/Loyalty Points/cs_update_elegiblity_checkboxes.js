/**
*@NApiVersion 2.1
*@NScriptType ClientScript
*/
define(['N/search', 'N/ui/dialog', "N/record"],
    function (search, dialog, record) {
        // var oldlinecount = 0
        var fieldUpdated = false
        function validateLine(context) {
            var currentRecord = context.currentRecord;
            var lineCount = currentRecord.getLineCount({ sublistId: 'item' });
            // log.debug("oldlinecount : ", oldlinecount)
            // log.debug("lineCount : ", lineCount)
            if (context.sublistId === 'item' && fieldUpdated == false) { //&& lineCount > context.line
                let currentRecord = context.currentRecord;
                let customerID = currentRecord.getValue({ fieldId: "entity" });
                let tranDate = currentRecord.getValue({ fieldId: "trandate" });
               
                var customerFields = search.lookupFields({
                    type: 'customer',
                    id: customerID,
                    columns: ['custentity_is_member', 'custentity_lp_reference']
                });

                var LPFields = search.lookupFields({
                    type: 'customrecord_loyalty_points',
                    id: customerFields.custentity_lp_reference[0].value,
                    columns: ['custrecord_lp_startdate', 'custrecord_lp_expirydate', "custrecord_lp_balance"]
                });
                // log.debug('LPFields : ', LPFields)
                
                var checkLPperUnit = false;

                let itemId = currentRecord.getCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: "item",
                });
                let rate = currentRecord.getCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: "rate",
                });
                let qty = currentRecord.getCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: "quantity",
                });
                var estLp = rate * qty
                // log.debug('estLp : ', estLp)
                var invantoryItemFields = search.lookupFields({
                    type: 'inventoryitem',
                    id: itemId,
                    columns: ['custitem_lps_redeemable_per_unit']
                });

                if (invantoryItemFields.custitem_lps_redeemable_per_unit != "") {
                    checkLPperUnit = true
                }

                let member = getMember(customerID);
                // log.debug('checkLPperUnit : ', checkLPperUnit)
                // log.debug('member : ', member)
                // LP reference is not present but fall between LP dates
                let betweenDate = IsfallInMembershipDate(tranDate, member.startDate, member.expireDate);
                let betweenLpExpireDate = IsfallInMembershipDate(tranDate, LPFields.custrecord_lp_startdate, LPFields.custrecord_lp_expirydate);
                log.debug('betweenDate : ', betweenDate);
                log.debug('betweenLpExpireDate : ', betweenLpExpireDate);


                if (betweenLpExpireDate.IsInBetween && member.LP_Balance != 0 && checkLPperUnit && fieldUpdated == false) {
                    log.debug('Eligible for LPs because trandate falls between lp dates date : ')

                    currentRecord.setValue({ fieldId: 'custbody_pay_meth_is_lp', value: true });
                    currentRecord.setValue({ fieldId: 'custbody_is_eligible_for_lps', value: false });
                    fieldUpdated = true

                } else if (betweenDate.IsInBetween) {
                    log.debug('Payment Method is LP')
                    currentRecord.setValue({ fieldId: 'custbody_pay_meth_is_lp', value: false });
                    currentRecord.setValue({ fieldId: 'custbody_is_eligible_for_lps', value: true });

                }

            }
            // oldlinecount = lineCount
            return true;
        }

        const IsfallInMembershipDate = (tranDate, startDate, expireDate) => {
            let formatedtranDate = getFormatedDate(tranDate);
            // log.debug('tranDate : ', tranDate)
            // log.debug('formatedtranDate : ', formatedtranDate)

            return dateIsINBetween(formatedtranDate, startDate, expireDate)
        }

        const getFormatedDate = (fdate) => {
            const date = fdate;
            const yyyy = date.getFullYear();
            let mm = date.getMonth() + 1; // Months start at 0!
            let dd = date.getDate();

            // if (dd < 10) dd = '0' + dd;
            // if (mm < 10) mm = '0' + mm;

            const formattedDate = mm + '/' + dd + '/' + yyyy;
            return formattedDate
        }

        const dateIsINBetween = (trandate, StartDate, ExpireDate) => {
            var dateFrom = new Date(StartDate);
            var dateTo = new Date(ExpireDate);
            var dateCheck = new Date(trandate);
            // log.debug("StartDate : ", StartDate)
            // log.debug("ExpireDate : ", ExpireDate)
            // var d1 = dateFrom.split("/");
            // var d2 = dateTo.split("/");
            // var c = dateCheck.split("/");

            // var from = new Date(d1[2], parseInt(d1[1]) - 1, d1[0]);  // -1 because months are from 0 to 11
            // var to = new Date(d2[2], parseInt(d2[1]) - 1, d2[0]);
            // var check = new Date(c[2], parseInt(c[1]) - 1, c[0]);


            if (dateFrom < dateCheck && dateCheck < dateTo) {
                return {
                    "IsInBetween": true
                }
            } else {
                return {
                    "IsInBetween": false
                }
            }
        }

        const getMember = (customerId) => {

            var fieldLookUp = search.lookupFields({
                type: search.Type.CUSTOMER,
                id: customerId,
                columns: ['custentity_is_member', 'custentity_membership_start_date', 'custentity_membership_end_date', "custentity_lp_balance"]
            });
            if (fieldLookUp.custentity_is_member) {
                return {
                    "isActive": true,
                    "startDate": fieldLookUp.custentity_membership_start_date,
                    "expireDate": fieldLookUp.custentity_membership_end_date,
                    "LP_Balance": parseInt(fieldLookUp.custentity_lp_balance)
                }
            } else {
                return {
                    "isActive": false,
                    "LP_Balance": parseInt(fieldLookUp.custentity_lp_balance)
                }
            }
        }

        const createLoyaltyPointRec = (customerID, startDate) => {
            const LP_Rec = record.create({
                type: "customrecord_loyalty_points",
                isDynamic: true
            });
            LP_Rec.setValue({ fieldId: "custrecord_lp_customer", value: customerID });
            LP_Rec.setValue({
                fieldId: "custrecord_lp_startdate",
                value: format.parse({
                    value: startDate,
                    type: format.Type.DATE
                })
            });
            LP_Rec.setValue({ fieldId: "custrecord_lp_balance", value: 0 });
            // Set start date and expire date
            let LP_RecID = LP_Rec.save();
            log.debug("LP_RecID : ", LP_RecID);
            return LP_RecID;

        }

        return {

            validateLine: validateLine,

        };
    });
