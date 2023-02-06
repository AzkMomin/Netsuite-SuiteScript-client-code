/**
 * @NApiversion 2.1
 * @NScriptType UserEventScript
 */

define(['N/search', "N/record", "N/format"], function (search, record, format) {
    const beforeSubmit = (context) => {

        // Work on create or edit
        if (context.type == 'edit') {
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

                // Fetch for customer loyalty point rec
                let custLP_RecID = newRec.getValue({ fieldId: "custentity_lp_reference" });
                log.debug("loyalty points record ID : ", custLP_RecID);
                if (custLP_RecID != "") {
                    updateCustLoyaltyPointRec(custLP_RecID, {
                        IsStartDate: false,
                        startDate: membershipStartDate_NewRec,
                        expireDate: membershipEndtDate_NewRec
                    });
                }
            }
            else if (isMember_Oldrec == false && isMember_NewRec) {
                // Navigates to customer loyalty points record 
                let custLP_RecID = newRec.getValue({ fieldId: "custentity_lp_reference" });
                log.debug("loyalty points record ID : ", custLP_RecID);
                //If LP record found active 
                if (custLP_RecID != "") {
                    //Update the record
                    updateCustLoyaltyPointRec(custLP_RecID, {
                        IsStartDate: false,
                        startDate: membershipStartDate_NewRec,
                        expireDate: membershipEndtDate_NewRec
                    });
                } else {
                    // Create new loyalty points Record
                    let custLP_RecID = createCustLoyaltyPointRec(customer, membershipStartDate_NewRec, membershipEndtDate_NewRec);
                    log.debug("loyalty points record Created : ", custLP_RecID)

                    newRec.setValue({ fieldId: "custentity_lp_reference", value: custLP_RecID })
                }
            }
            else if ((membershipStartDate_Oldrec != membershipStartDate_NewRec) || (membershipEndtDate_Oldrec != membershipEndtDate_NewRec)) {
                let custLP_RecID = newRec.getValue({ fieldId: "custentity_lp_reference" });
                log.debug("loyalty points record ID : ", custLP_RecID)
                if (custLP_RecID != "") {
                    updateCustLoyaltyPointRec(custLP_RecID, {
                        IsStartDate: true,
                        startDate: membershipStartDate_NewRec,
                        expireDate: membershipEndtDate_NewRec
                    });
                } else {
                    let custLP_RecID = createCustLoyaltyPointRec(customer, membershipStartDate_NewRec, membershipEndtDate_NewRec);
                    log.debug("loyalty points record created because no Lp record found active  : Rec ID: ", custLP_RecID);
                    newRec.setValue({ fieldId: "custentity_lp_reference", value: custLP_RecID })
                }
            }

        }
    }

    const afterSubmit = (context) => {
        if (context.type == 'create') {
            let newRec = context.newRecord;
            let customer = context.newRecord.id;
            log.debug("customer : ", customer);
            let isMember = newRec.getValue({ fieldId: "custentity_is_member" });
            let membershipStartDate = newRec.getValue({ fieldId: "custentity_membership_start_date" });
            let membershipEndDate = newRec.getValue({ fieldId: "custentity_membership_end_date" });

            //If is member is checked 
            if (isMember) {
                // Create loyalty points record
                let custLoyaltyPointRecId = createCustLoyaltyPointRec(customer, membershipStartDate, membershipEndDate);
                log.debug("loyalty points record created successfully on creation of new customer : ", custLoyaltyPointRecId);

                newRec.setValue({ fieldId: "custentity_lp_reference", value: custLoyaltyPointRecId })
                var customerId = record.submitFields({
                    type: 'customer',
                    id: context.newRecord.id,
                    values: {
                        'custentity_lp_reference': custLoyaltyPointRecId
                    }
                });
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

        if (date.IsStartDate) {
            var LP_RecId = record.submitFields({
                type: 'customrecord_loyalty_points',
                id: id,
                values: {
                    'custrecord_lp_startdate': format.parse({
                        value: startDate,
                        type: format.Type.DATE
                    }),

                    "custrecord_lp_expirydate": format.parse({
                        value: getSurplusPointExpireDate(expireDate),
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
                        value: getSurplusPointExpireDate(expireDate),
                        type: format.Type.DATE
                    })
                }
            });
            log.debug("LP record updated ->  ID : ", LP_RecId)
        }

    }


    const getSurplusPointExpireDate = (fdate) => {
        const date = fdate;

        // newDate.setMonth(date.getMonth() + 3)
        const yyyy = date.getFullYear();
        let mm = date.getMonth() + 1 + 3; // Months start at 0!
        let dd = date.getDate();

        if (dd < 10) dd = '0' + dd;
        if (mm < 10) mm = '0' + mm;

        const formattedDate = mm + '/' + dd + '/' + yyyy;
        log.debug("newDate : ", new Date(formattedDate));

        return new Date(formattedDate)
    }

    return {
        beforeSubmit,
        afterSubmit
    }
});


