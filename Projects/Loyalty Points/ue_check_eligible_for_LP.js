/**
 * @NApiversion 2.1
 * @NScriptType UserEventScript
 */

define(['N/search', "N/record", "N/format"], function (search, record, format) {
    const beforeSubmit = (context) => {
        if (context.type == 'create') {
            let newRec = context.newRecord;
            let customerID = newRec.getValue({ fieldId: "entity" });
            let tranDate = newRec.getValue({ fieldId: "trandate" });

            //Check for active member
            let member = getMember(customerID);
            log.debug('member : ', member)
            if (member.isActive) {

                let betweenDate = IsfallInMembershipDate(tranDate, member.startDate, member.expireDate);
                let formatedTranmdDate = getFormatedDate(tranDate)
                let custLP_Rec = getCustLoyaltyPointRec(customerID, formatedTranmdDate)
                log.debug('betweenDate : ', betweenDate)
                if (betweenDate.IsInBetween) {
                    newRec.setValue({ fieldId: 'custbody_is_eligible_for_lps', value: true })
                }
                if (custLP_Rec.found == false) {
                    createLoyaltyPointRec(customerID, member.startDate)
                }
            }

        }
        else if (context.type == 'edit') {
            let newRec = context.newRecord;
            let tranDate = newRec.getValue({ fieldId: "trandate" });
            let customerID = newRec.getValue({ fieldId: "entity" });
            let member = getMember(customerID);
            log.debug('member : ', member)
            if (member.isActive) {
                let betweenDate = IsfallInMembershipDate(tranDate, member.startDate, member.expireDate);
                log.debug('betweenDate : ', betweenDate)
                if (betweenDate.IsInBetween) {
                    newRec.setValue({ fieldId: 'custbody_is_eligible_for_lps', value: true })
                }

            }
        }

    }

    const getCustLoyaltyPointRec = (customer, tranDate) => {
        //Fetch record
        const customrecord_loyalty_pointsSearchColId = search.createColumn({ name: 'id', sort: search.Sort.ASC });
        const customrecord_loyalty_pointsSearchColScriptId = search.createColumn({ name: 'scriptid' });
        const customrecord_loyalty_pointsSearchColStartDate = search.createColumn({ name: 'custrecord_lp_startdate' });
        const customrecord_loyalty_pointsSearchColExpiryDate = search.createColumn({ name: 'custrecord_lp_expirydate' });

        const customrecord_loyalty_pointsSearch = search.create({
            type: 'customrecord_loyalty_points',
            filters: [
                ['custrecord_lp_customer', 'anyof', customer],
                'AND',
                ['custrecord_lp_startdate', 'on', '1/1/2023'],
            ],
            columns: [
                customrecord_loyalty_pointsSearchColId,
                customrecord_loyalty_pointsSearchColScriptId,
                customrecord_loyalty_pointsSearchColStartDate,
                customrecord_loyalty_pointsSearchColExpiryDate,
            ],
        });

        const customrecord_loyalty_pointsSearchPagedData = customrecord_loyalty_pointsSearch.runPaged({ pageSize: 1000 });
        if (!customrecord_loyalty_pointsSearchPagedData.pageRanges.length) {
            for (let i = 0; i < customrecord_loyalty_pointsSearchPagedData.pageRanges.length; i++) {
                const customrecord_loyalty_pointsSearchPage = customrecord_loyalty_pointsSearchPagedData.fetch({ index: i });
                customrecord_loyalty_pointsSearchPage.data.forEach((result) => {
                    const id = result.getValue(customrecord_loyalty_pointsSearchColId);
                    const startDate = result.getValue(customrecord_loyalty_pointsSearchColStartDate);
                    const expiryDate = result.getValue(customrecord_loyalty_pointsSearchColExpiryDate);
                    return {
                        found: true,
                        id: id,
                    };
                });
            }
        } else {
            return {
                found: false
            };
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

        if (dd < 10) dd = '0' + dd;
        if (mm < 10) mm = '0' + mm;

        const formattedDate = mm + '/' + dd + '/' + yyyy;
        return formattedDate
    }

    const dateIsINBetween = (trandate, StartDate, ExpireDate) => {
        var dateFrom = StartDate;
        var dateTo = ExpireDate;
        var dateCheck = trandate;

        var d1 = dateFrom.split("/");
        var d2 = dateTo.split("/");
        var c = dateCheck.split("/");

        var from = new Date(d1[2], parseInt(d1[1]) - 1, d1[0]);  // -1 because months are from 0 to 11
        var to = new Date(d2[2], parseInt(d2[1]) - 1, d2[0]);
        var check = new Date(c[2], parseInt(c[1]) - 1, c[0]);
        if (check > from && check < to) {
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
            columns: ['custentity_is_member', 'custentity_membership_start_date', 'custentity_membership_end_date']
        });

        if (fieldLookUp.custentity_is_member) {
            return {
                "isActive": true,
                "startDate": fieldLookUp.custentity_membership_start_date,
                "expireDate": fieldLookUp.custentity_membership_end_date,
            }
        } else {
            return {
                "isActive": false
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

    }


    return {
        beforeSubmit,
    }
});