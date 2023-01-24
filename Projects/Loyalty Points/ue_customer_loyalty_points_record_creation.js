/**
 * @NApiversion 2.1
 * @NScriptType UserEventScript
 */

define(['N/search', "N/record", "N/format"], function (search, record, format) {
    const beforeSubmit = (context) => {

        // Work on create or edit
        if (context.type == 'create') {
            let newRec = context.newRecord;
            let customer = newRec.getValue({ fieldId: "altname" });
            let isMember = newRec.getValue({ fieldId: "custentity_is_member" });
            let membershipStartDate = newRec.getValue({ fieldId: "custentity_membership_start_date" });
            let membershipEndDate = newRec.getValue({ fieldId: "custentity_membership_end_date" });

            //If is member is checked 
            if (isMember) {
                // Create loyalty points record
                let custLoyaltyPointRec = createCustLoyaltyPointRec(customer, membershipStartDate, membershipEndDate);
                log.debug("loyalty points record save : ", custLoyaltyPointRec)
            }

        } else if (context.type == 'edit') {
            let oldRec = context.oldRecord;
            let newRec = context.newRecord;
            let customer = context.newRecord.id
            let isMember_Oldrec = oldRec.getValue({ fieldId: "custentity_is_member" });
            let isMember_NewRec = newRec.getValue({ fieldId: "custentity_is_member" });
            log
            let membershipStartDate_NewRec = newRec.getValue({ fieldId: "custentity_membership_start_date" });
            let membershipEndtDate_NewRec = newRec.getValue({ fieldId: "custentity_membership_end_date" });

            let membershipStartDate_Oldrec = oldRec.getValue({ fieldId: "custentity_membership_start_date" });
            let membershipEndtDate_Oldrec = oldRec.getValue({ fieldId: "custentity_membership_end_date" });

            if (isMember_Oldrec && isMember_NewRec == false) {
                // Navigates to customer loyalty points record and update membership end date

                // Fetch for customer loyalty point rec
                let custLoyaltyPointRecID = getCustLoyaltyPointRec(customer);
                log.debug("loyalty points record ID : ", custLoyaltyPointRecID)
                updateCustLoyaltyPointRec(custLoyaltyPointRecID, {
                    IsStartDate: false,
                    startDate: "",
                    expireDate: membershipEndtDate_NewRec
                }); // startDate is empty because we have to set only expire date because we are ending membership
            }
            else if (isMember_Oldrec == false && isMember_NewRec) {
                // Navigates to customer loyalty points record 
                let custLoyaltyPointRec = getCustLoyaltyPointRec(customer, membershipStartDate_NewRec);
                log.debug("loyalty points record found : ", custLoyaltyPointRec)
                //If LP record found active 
                if (custLoyaltyPointRec.found) {
                    //Update the record
                    updateCustLoyaltyPointRec(custLoyaltyPointRec.id, {
                        IsStartDate: true,
                        startDate: membershipStartDate_NewRec,
                        expireDate: membershipEndtDate_NewRec
                    });
                } else {
                    // Create new loyalty points Record
                    let custLoyaltyPointRec = createCustLoyaltyPointRec(customer, membershipStartDate_NewRec, membershipEndtDate_NewRec);
                    log.debug("loyalty points record save : ", custLoyaltyPointRec)
                }
            }
            else if ((membershipStartDate_Oldrec != membershipStartDate_NewRec) || (membershipEndtDate_Oldrec != membershipEndtDate_NewRec)) {
                let custLoyaltyPointRec = getCustLoyaltyPointRec(customer, membershipStartDate_NewRec)
                log.debug("loyalty points record ID : ", custLoyaltyPointRec)
                updateCustLoyaltyPointRec(custLoyaltyPointRec.id, {
                    IsStartDate: true,
                    startDate: membershipStartDate_NewRec,
                    expireDate: membershipEndtDate_NewRec
                });
            }

        }
    }


    const getCustLoyaltyPointRec = (customer, membershipStartDate) => {
        let obj;
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
        if (customrecord_loyalty_pointsSearchPagedData.pageRanges.length != 0) {
            let recFound = false;
            for (let i = 0; i < customrecord_loyalty_pointsSearchPagedData.pageRanges.length; i++) {
                const customrecord_loyalty_pointsSearchPage = customrecord_loyalty_pointsSearchPagedData.fetch({ index: i });
                customrecord_loyalty_pointsSearchPage.data.forEach((result) => {
                    const id = result.getValue(customrecord_loyalty_pointsSearchColId);
                    const startDate = result.getValue(customrecord_loyalty_pointsSearchColStartDate);
                    const expiryDate = result.getValue(customrecord_loyalty_pointsSearchColExpiryDate);


                    const fmembershipStartDate = getFormatedDate(membershipStartDate);//Converted date into mm/dd/yyyy
                    const checkDates = dateIsINBetween(startDate, expiryDate, fmembershipStartDate);

                    log.debug("checkDates : ", checkDates)

                    // Check membership stard date is in between Loyalty points start and expire date when renewal 
                    if (checkDates.IsInBetween) {
                        //Found then return the ID
                        log.debug("date found : ")
                        obj =  {
                            found: true,
                            id: id,
                        };
                        recFound = true
                    }
                });
            }
            if(recFound == false){
                obj =  {
                    found: false
                };
            }
        } else {
            // Customer Rec not found
            obj =  {
                found: false
            };
        }
        return obj;
        
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

    const dateIsINBetween = (StartDate, ExpireDate, membershipStratDate) => {
        log.debug("StartDate : ", StartDate)
        log.debug("ExpireDate : ", ExpireDate)
        log.debug("membershipStratDate : ", membershipStratDate)
        var dateFrom = StartDate;
        var dateTo = ExpireDate;
        var dateCheck = membershipStratDate;

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

    const createCustLoyaltyPointRec = (customer, membershipStartDate, membershipEndDate) => {
        let loyaltyPointsRec = record.create({
            type: "customrecord_loyalty_points",
            isDynamic: true
        })

        loyaltyPointsRec.setValue({ fieldId: "custrecord_lp_customer", value: customer });
        loyaltyPointsRec.setValue({ fieldId: "custrecord_lp_balance", value: 0 });
        if (membershipStartDate == "") {
            membershipStartDate = new Date();
        }

        loyaltyPointsRec.setValue({
            fieldId: "custrecord_lp_startdate",
            value: format.parse({
                value: membershipStartDate,
                type: format.Type.DATE
            })
        })
        loyaltyPointsRec.setValue({
            fieldId: "custrecord_lp_expirydate",
            value: format.parse({
                value: membershipEndDate,
                type: format.Type.DATE
            })
        })
        const saveRec = loyaltyPointsRec.save();
        return saveRec;
    }
    const updateCustLoyaltyPointRec = (id, date) => {
        log.debug('date rec : ', date)
        log.debug('customer ID : ', id)
        let startDate = date.startDate;
        let expireDate = date.expireDate;

        if (startDate == "") {
            startDate = new Date;;
        }
        if (!startDate) {
            var LP_RecId = record.submitFields({
                type: 'customrecord_loyalty_points',
                id: id,
                values: {
                    'custrecord_lp_startdate': format.parse({
                        value: startDate,
                        type: format.Type.DATE
                    }),

                    "custrecord_lp_expirydate": format.parse({
                        value: expireDate,
                        type: format.Type.DATE
                    })
                }
            });
            log.debug("LP record updated ->  ID : ", LP_RecId)
        } else {
            var LP_RecId = record.submitFields({
                type: 'customrecord_loyalty_points',
                id: id,
                values: {
                    "custrecord_lp_expirydate": format.parse({
                        value: expireDate,
                        type: format.Type.DATE
                    })
                }
            });
            log.debug("LP record updated ->  ID : ", LP_RecId)
        }

    }


    const getSurplusPointExpireDate = (date) => {
        log.debug("expiredate : ", date);
        var month = date.getMonth() + 3;
        if (month < 10) month = "0" + month;
        var dateOfMonth = date.getDate();
        if (dateOfMonth < 10) dateOfMonth = "0" + dateOfMonth;
        var year = date.getFullYear();
        var formattedDate = dateOfMonth + "/" + month + "/" + year;
        log.debug("formattedDate after 3 months : ", formattedDate);
        return formattedDate;
    }
    return {
        beforeSubmit,
    }
});


