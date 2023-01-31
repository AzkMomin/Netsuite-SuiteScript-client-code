/**
 * @NApiversion 2.1
 * @NScriptType UserEventScript
 */

define(['N/search', "N/record", "N/format"], function (search, record, format) {
    const beforeSubmit = (context) => {
        if (context.type == 'create') {
            let newRec = context.newRecord;
            let status = newRec.getValue({ fieldId: "status" });


            //Check for shipped status
            if (status == "Shipped") {
                let SO_ID = newRec.getValue({ fieldId: "createdfrom" });
                let customerID = newRec.getValue({ fieldId: "entity" });

                var So_Fields = search.lookupFields({
                    type: 'salesorder',
                    id: SO_ID,
                    columns: ['custentity_is_member']
                });
                //Get for expire date > today
                let expireIsGraterThenToday = expireIsGrater(customerID)
                //Check for isMember is true &&  expire date > today
                if (So_Fields.custentity_is_member && expireIsGraterThenToday.IsTrue) {
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

    const expireIsGrater = (customerID) => {
        var customerFields = search.lookupFields({
            type: search.Type.CUSTOMER,
            id: customerId,
            columns: ['custentity_membership_start_date', 'custentity_membership_end_date']
        });

        let custLoyaltyPointRec = getCustLoyaltyPointRec(customerID,customerFields.custentity_membership_start_date);
        return getCheckExpire(custLoyaltyPointRec);

    }
    const getCustLoyaltyPointRec = (customer,startDate) => {
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
                ['custrecord_lp_startdate', 'on', startDate],
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
                        startDate :startDate,
                        expiryDate : expiryDate
                    };
                });
            }
        } else {
            return {
                found: false
            };
        }
    }

    const getCheckExpire = (custLoyaltyPointRec)=>{
        let expireDate = custLoyaltyPointRec.expireDate;
        let today = getFormatedDate(new Date());

        var d1 = expireDate.split("/");
        var d2 = today.split("/");
       

        var checkExpireDate = new Date(d1[2], parseInt(d1[1]) - 1, d1[0]);  // -1 because months are from 0 to 11
        var checkToday = new Date(d2[2], parseInt(d2[1]) - 1, d2[0]);
        
        if ( checkExpireDate > checkToday) {
            return {
                "IsTrue": true
            }
        } else {
            return {
                "IsTrue": false
            }
        }
    }
    


    return {
        beforeSubmit,
    }
});