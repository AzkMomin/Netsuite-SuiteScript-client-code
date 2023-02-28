/**
 * @NApiversion 2.1
 * @NScriptType UserEventScript
 */

define(['N/search', "N/record", "N/format"], function (search, record, format) {
    const beforeSubmit = (context) => {
        if (context.type == 'create' || context.type == 'edit') {
            try {
                let newRec = context.newRecord;
                let customerID = newRec.getValue({ fieldId: "entity" });
                let tranDate = newRec.getValue({ fieldId: "trandate" });

                var checkForDates = true
                if (context.type == 'edit') {
                    let oldRec = context.oldRecord;
                    let oldtranDate = oldRec.getValue({ fieldId: "trandate" });
                    log.debug('tranDate : ', tranDate)
                    log.debug('oldtranDate : ', oldtranDate)
                    if (String(oldtranDate) === String(tranDate)) {
                        log.debug(' Old And new Dates are not equal ')
                        checkForDates = false
                    }
                }
                //If old trandate == new trandate on edit then dont check further
                if (checkForDates) {
                    var customerFields = search.lookupFields({
                        type: 'customer',
                        id: customerID,
                        columns: ['custentity_is_member', 'custentity_lp_reference']
                    });

                    var LPFields = search.lookupFields({
                        type: 'customrecord_loyalty_points',
                        id: customerFields.custentity_lp_reference[0].value,
                        columns: ['custrecord_lp_startdate', 'custrecord_lp_expirydate']
                    });

                    const SoLineCount = newRec.getLineCount({ sublistId: "item" });
                    for (let i = 0; i < SoLineCount; i++) {
                        let itemId = newRec.getSublistValue({
                            sublistId: 'item',
                            fieldId: "item",
                            line: i
                        });

                        var invantoryItemFields = search.lookupFields({
                            type: 'inventoryitem',
                            id: itemId,
                            columns: ['custitem_lps_redeemable_per_unit']
                        });
                        newRec.setSublistValue({ sublistId: "item", fieldId: "custcol_redemption_rate", line: i, value: invantoryItemFields.custitem_lps_redeemable_per_unit })

                    }
                    let member = getMember(customerID);
                    log.debug('member : ', member)

                    // LP reference is not present but fall between LP dates
                    let betweenDate = IsfallInMembershipDate(tranDate, member.startDate, member.expireDate);
                    let betweenLpExpireDate = IsfallInMembershipDate(tranDate, LPFields.custrecord_lp_startdate, LPFields.custrecord_lp_expirydate);
                    log.debug('betweenDate : ', betweenDate)
                    log.debug('betweenLpExpireDate : ', betweenLpExpireDate)
                    if (betweenDate.IsInBetween && member.LP_Balance == 0) {
                        log.debug('Eligible for LPs because trandate falls between membership date : ')
                        newRec.setValue({ fieldId: 'custbody_is_eligible_for_lps', value: true });
                        if (!customerFields.custentity_lp_reference) {
                            // LP reference is not present but fall between LP dates
                            const LP_RecId = createLoyaltyPointRec(customerID, member.startDate);
                            const customerSaveID = record.submitFields({
                                type: "customer",
                                id: customerID,
                                values: {
                                    "custentity_lp_reference": LP_RecId
                                }
                            });
                            log.debug("Successfully set reference of newly created LP record : ID : ", customerSaveID);
                        }
                    } else if (betweenLpExpireDate.IsInBetween && betweenLpExpireDate.LP_Balance != 0) {
                        if (context.type == 'create') {
                            log.debug('Payment Method is LP')
                            newRec.setValue({ fieldId: 'custbody_pay_meth_is_lp', value: true });
                        }
                    }
                    if (betweenDate.IsInBetween == false) {
                        newRec.setValue({ fieldId: 'custbody_is_eligible_for_lps', value: false });
                    }

                }
            }
            catch (e) {
                log.debug("Error : ", e)
            }
        } 

    }


    const IsfallInMembershipDate = (tranDate, startDate, expireDate) => {
        let formatedtranDate = getFormatedDate(tranDate);
        log.debug('tranDate : ', tranDate)
        log.debug('formatedtranDate : ', formatedtranDate)

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
        log.debug("StartDate : ", StartDate)
        log.debug("ExpireDate : ", ExpireDate)
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
        beforeSubmit,
    }
});