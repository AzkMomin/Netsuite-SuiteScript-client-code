/**
 * @NApiversion 2.1
 * @NScriptType UserEventScript
 */

define(['N/search', "N/record", "N/format"], function (search, record, format) {
    const getCustLoyaltyPointRec = (customer) => {
        //Fetch record
        const customrecord_loyalty_pointsSearchColId = search.createColumn({ name: 'id', sort: search.Sort.ASC });
        const customrecord_loyalty_pointsSearchColScriptId = search.createColumn({ name: 'scriptid' });
        const customrecord_loyalty_pointsSearch = search.create({
            type: 'customrecord_loyalty_points',
            filters: [
                ['custrecord_lp_customer', 'anyof', customer],
            ],
            columns: [
                customrecord_loyalty_pointsSearchColId,
                customrecord_loyalty_pointsSearchColScriptId,
            ],
        });

        const customrecord_loyalty_pointsSearchPagedData = customrecord_loyalty_pointsSearch.runPaged({ pageSize: 1000 });
        if (!customrecord_loyalty_pointsSearchPagedData.pageRanges.length) {
            for (let i = 0; i < customrecord_loyalty_pointsSearchPagedData.pageRanges.length; i++) {
                const customrecord_loyalty_pointsSearchPage = customrecord_loyalty_pointsSearchPagedData.fetch({ index: i });
                customrecord_loyalty_pointsSearchPage.data.forEach((result) => {
                    const id = result.getValue(customrecord_loyalty_pointsSearchColId);
                    const scriptId = result.getValue(customrecord_loyalty_pointsSearchColScriptId);
                    return id;
                });
            }
        } else {

        }
    }

    const createCustLoyaltyPointRec = (customer, membershipStartDate) => {
        let loyaltyPointsRec = record.create({
            type: "customrecord_loyalty_points",
            isDynamic: true
        })

        loyaltyPointsRec.setValue({ fieldId: "custrecord_lp_customer", value: customer });
        if (!membershipStartDate) {
            setDate(loyaltyPointsRec, "custrecord_lp_startdate", membershipStartDate)
        } else {
            setDate(loyaltyPointsRec, "custrecord_lp_startdate", membershipStartDate)
        }
        const saveRec = loyaltyPointsRec.save();
        return saveRec;
    }
    const updateCustLoyaltyPointRec = (id, date) => {
        let loyaltyPointsRec = record.load({
            type: "customrecord_loyalty_points",
            id: id,
            isDynamic: true
        })

        if (date.IsStartDate) {
            setDate(loyaltyPointsRec, "custrecord_lp_startdate", date.Date)
        } else {
            setDate(loyaltyPointsRec, "custrecord_lp_expirydate", date.Date)
        }
    }

    const setDate = (loyaltyPointsRec, fieldid, date) => {
        if (date != "" && fieldid != "custrecord_lp_expirydate") {
            date = date;
        } else if (date == "" && fieldid != "custrecord_lp_expirydate") {
            date = new Date;
        }
        else if (date != "" && fieldid == "custrecord_lp_expirydate") {
            date = getSurplusPointExpireDate(date);
        }
        else if (date == "" && fieldid == "custrecord_lp_expirydate") {
            date = getSurplusPointExpireDate(new Date);
        }
        loyaltyPointsRec.setValue({
            fieldId: fieldid,
            value: format.parse({
                value: date,
                type: format.Type.DATE
            })
        });
    }
    const getSurplusPointExpireDate = (date) => {
        console.log(currentDate);
        var month = currentDate.getMonth()+3;
        if (month < 10) month = "0" + month;
        var dateOfMonth = currentDate.getDate();
        if (dateOfMonth < 10) dateOfMonth = "0" + dateOfMonth;
        var year = currentDate.getFullYear();
        var formattedDate = dateOfMonth + "/" + month + "/" + year;
        log.debug(formattedDate);
        return formattedDate;
    }

    const beforeSubmit = (context) => {


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