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
        // Note: Search.run() is limited to 4,000 results
        // customrecord_loyalty_pointsSearch.run().each((result: search.Result): boolean => {
        //   return true;
        // });
        const customrecord_loyalty_pointsSearchPagedData = customrecord_loyalty_pointsSearch.runPaged({ pageSize: 1000 });
        for (let i = 0; i < customrecord_loyalty_pointsSearchPagedData.pageRanges.length; i++) {
            const customrecord_loyalty_pointsSearchPage = customrecord_loyalty_pointsSearchPagedData.fetch({ index: i });
            customrecord_loyalty_pointsSearchPage.data.forEach((result) => {
                const id = result.getValue(customrecord_loyalty_pointsSearchColId);
                const scriptId = result.getValue(customrecord_loyalty_pointsSearchColScriptId);
            });
        }
    }

    const createCustLoyaltyPointRec = (customer, membershipStartDate) => {
        let loyaltyPointsRec = record.create({
            type: "customrecord_loyalty_points",
            isDynamic: true
        })

        loyaltyPointsRec.setValue({ fieldId: "custrecord_lp_customer", value: customer });
        if (!membershipStartDate) {
            loyaltyPointsRec.setValue({ fieldId: "custrecord_lp_startdate", value: membershipStartDate });
        } else {
            membershipStartDate = format.parse({
                value: new Date(),
                type: format.Type.DATE
            });
            loyaltyPointsRec.setValue({ fieldId: "custrecord_lp_startdate", value: membershipStartDate });
        }
        const saveRec = loyaltyPointsRec.save();
        return saveRec;
    }
    const updateCustLoyaltyPointRec = (id) => {

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
            let customer = newRec.getValue({ fieldId: "altname" });
            let isMember_Oldrec = oldRec.getValue({ fieldId: "custentity_is_member" });
            let isMember_NewRec = newRec.getValue({ fieldId: "custentity_is_member" });

            let membershipStartDate_NewRec = newRec.getValue({ fieldId: "custentity_membership_start_date" });
            let membershipEndtDate_NewRec = newRec.getValue({ fieldId: "custentity_membership_end_date" });

            let membershipStartDate_Oldrec = oldRec.getValue({ fieldId: "custentity_membership_start_date" });
            let membershipEndtDate_Oldrec = oldRec.getValue({ fieldId: "custentity_membership_end_date" });

            if (isMember_Oldrec && isMember_NewRec == false) {
                // Navigates to customer loyalty points record and update membership end date

                // Fetch for customer loyalty pointr rec
                let LoyaltyPointRec = getCustLoyaltyPointRec(customer);
                updateCustLoyaltyPointRec(LoyaltyPointRec);
            }
            else if (isMember_Oldrec == false && isMember_NewRec) {
                // Navigates to customer loyalty points record and update membership start date

                if (!membershipStartDate_Oldrec && membershipStartDate_NewRec != "") {

                }
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