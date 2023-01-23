/**
 * @NApiversion 2.1
 * @NScriptType UserEventScript
 */

define(['N/search', "N/record", "N/format"], function (search, record, format) {
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
                    var trandate = getFormatedDate(tranDate)
                    let FormatedStartDate = getFormatedDate(startDate)
                    let FormatedExpireDate = getFormatedDate(expiryDate)
                    let dateBetween = dateIsINBetween(trandate, FormatedStartDate, FormatedExpireDate)
                    if (dateBetween.IsInBetween) {
                        return {
                            id: id,
                            startDate: startDate,
                            expiryDate: expiryDate
                        };

                    }
                });
            }
        } else {

        }
    }
    const getFormatedDate = (tranDate) => {
        const date = tranDate;
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

    const beforeSubmit = (context) => {
        if (context.type == 'create') {
            let newRec = context.newRecord;
            let customer = newRec.getValue({ fieldId: "entity" });
            let tranDate = newRec.getValue({ fieldId: "trandate" });
            let custLoyaltyPointRecID = getCustLoyaltyPointRec(customer, tranDate);

            dateBetween(tranDate)
        }

    }


    const afterSubmit = (context) => {

        // Work on create or edit
        if (context.type == 'create') {
            let newRec = context.newRecord;
            let customer = newRec.getValue({ fieldId: "altname" });
            let isMember = newRec.getValue({ fieldId: "custentity_is_member" });
            let membershipStartDate = newRec.getValue({ fieldId: "custentity_membership_start_date" });

            //If is member is checked 
            if (isMember) {
                // Create loyalty points record
                let custLoyaltyPointRec = createCustLoyaltyPointRec(customer, membershipStartDate);

                log.debug("loyalty points record save : ", custLoyaltyPointRec)
            }

        } else if (context.type == 'edit') {
            let oldRec = context.oldRecord;
            let newRec = context.newRecord;
            let customer = context.newRecord.id
            let isMember_Oldrec = oldRec.getValue({ fieldId: "custentity_is_member" });
            let isMember_NewRec = newRec.getValue({ fieldId: "custentity_is_member" });

            let membershipStartDate_NewRec = newRec.getValue({ fieldId: "custentity_membership_start_date" });
            let membershipEndtDate_NewRec = newRec.getValue({ fieldId: "custentity_membership_end_date" });

            let membershipStartDate_Oldrec = oldRec.getValue({ fieldId: "custentity_membership_start_date" });
            let membershipEndtDate_Oldrec = oldRec.getValue({ fieldId: "custentity_membership_end_date" });

            if (isMember_Oldrec && isMember_NewRec == false) {
                // Navigates to customer loyalty points record and update membership end date

                // Fetch for customer loyalty pointr rec
                let custLoyaltyPointRecID = getCustLoyaltyPointRec(customer);
                log.debug("loyalty points record ID : ", custLoyaltyPointRecID)
                updateCustLoyaltyPointRec(custLoyaltyPointRecID, { IsStartDate: false, Date: membershipEndtDate_NewRec });
            }
            else if (isMember_Oldrec == false && isMember_NewRec) {
                // Navigates to customer loyalty points record and update membership start date
                let custLoyaltyPointRecID = getCustLoyaltyPointRec(customer);
                log.debug("loyalty points record ID : ", custLoyaltyPointRecID)
                updateCustLoyaltyPointRec(custLoyaltyPointRecID, { IsStartDate: true, Date: membershipStartDate_NewRec });
            }
        }

        // var otherId = record.submitFields({
        //     type: 'salesorder',
        //     id: '9293',
        //     values: {
        //         'custrecord_rating': '2'
        //     }
        // });
    }

    return {

        beforeSubmit,
        afterSubmit,
    }
});