/**
 * @NApiversion 2.0
 * @NScriptType UserEventScript
 */

define(['N/format', 'N/record','N/search'], function (format, record,search) {
    function afterSubmit(context) {
        // try {
        var invRec = record.load({
            type: 'invoice',
            id: context.newRecord.id
        });
        var status = invRec.getValue('status');
        log.debug("status : ", status)
        if (status == 'Paid In Full') {

            var tot = parseFloat(invRec.getValue('custbodyfinal_commission'))
            log.debug("tot : ", tot)

            var customerId = invRec.getValue('entity');

            var custFields = search.lookupFields({
                type: "customer",
                id: customerId,
                columns: ['custentitydfs_type_commission']
            });

            var type_comm = custFields.custentitydfs_type_commission[0].value
            log.debug("type_comm : ", type_comm)

            var commRec = record.create({
                type: 'customtransaction_amz_commission',
                isDynamic: true
            });
            // log.debug('commRec', commRec);

            // var commRec_type = commRec.type;
            // log.debug('commRec_type', commRec_type);

            commRec.setValue({
                fieldId: 'subsidiary',
                value: invRec.getValue('subsidiary'),
                ignoreFieldChange: true
            });
            if (type_comm == '1') {
                commRec.setValue({
                    fieldId: 'custbody_amz_sales_rep',
                    value: invRec.getValue('salesrep'),
                    ignoreFieldChange: true
                });

                commRec.setValue({
                    fieldId: 'location',
                    value: invRec.getValue('location'),
                    ignoreFieldChange: true
                });

                commRec.setValue({
                    fieldId: 'department',
                    value: invRec.getValue('department'),
                    ignoreFieldChange: true
                });

                commRec.setValue({
                    fieldId: 'transtatus',
                    value: 'B',
                    ignoreFieldChange: true
                });

                var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

                var parsedDate = format.parse({ value: invRec.getValue('trandate'), type: format.Type.DATE });

                var postingPeriod = months[parsedDate.getMonth()] + ' ' + parsedDate.getFullYear();
                log.debug('postingPeriod', postingPeriod);

                var firstDay = new Date(parsedDate.getFullYear(), parsedDate.getMonth() + 1, 1);
                log.debug('firstDay', firstDay);

                commRec.setText({
                    fieldId: 'postingperiod',
                    value: postingPeriod,
                    ignoreFieldChange: true
                });

                commRec.setValue({
                    fieldId: 'trandate',
                    value: parsedDate,
                    ignoreFieldChange: true
                });

                commRec.setValue({
                    fieldId: 'custbody_amz_reversal_date',
                    value: firstDay,
                    ignoreFieldChange: true
                });

                commRec.setValue({
                    fieldId: 'custbody_amz_invoice_num',
                    value: context.newRecord.id,
                    ignoreFieldChange: true
                });


                commRec.selectLine({
                    sublistId: 'line', line: 0
                });
                commRec.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'account',
                    value: 617

                });

                commRec.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'debit',
                    value: tot
                });
                commRec.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'entity',
                    value: ''

                });
                commRec.commitLine({
                    sublistId: 'line'
                });

                commRec.selectLine({
                    sublistId: 'line',
                    line: 1
                });
                commRec.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'account',
                    value: 751

                });

                commRec.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'credit',
                    value: tot
                });

                commRec.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'custcol_amz_sales_rep_partner',
                    value: invRec.getValue('salesrep')
                });
                commRec.commitLine({
                    sublistId: 'line'
                });
            } else if (type_comm == '2') {
                commRec.setValue({
                    fieldId: 'custbody_amz_partner',
                    value: invRec.getValue('partner'),
                    ignoreFieldChange: true
                });


                commRec.setValue({
                    fieldId: 'location',
                    value: invRec.getValue('location'),
                    ignoreFieldChange: true
                });

                commRec.setValue({
                    fieldId: 'department',
                    value: invRec.getValue('department'),
                    ignoreFieldChange: true
                });

                commRec.setValue({
                    fieldId: 'transtatus',
                    value: 'B',
                    ignoreFieldChange: true
                });

                var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

                var parsedDate = format.parse({ value: invRec.getValue('trandate'), type: format.Type.DATE });

                var postingPeriod = months[parsedDate.getMonth()] + ' ' + parsedDate.getFullYear();
                log.debug('postingPeriod', postingPeriod);

                var firstDay = new Date(parsedDate.getFullYear(), parsedDate.getMonth() + 1, 1);
                log.debug('firstDay', firstDay);

                commRec.setText({
                    fieldId: 'postingperiod',
                    value: postingPeriod,
                    ignoreFieldChange: true
                });

                commRec.setValue({
                    fieldId: 'trandate',
                    value: parsedDate,
                    ignoreFieldChange: true
                });

                commRec.setValue({
                    fieldId: 'custbody_amz_reversal_date',
                    value: firstDay,
                    ignoreFieldChange: true
                });

                commRec.setValue({
                    fieldId: 'custbody_amz_invoice_num',
                    value: invId,
                    ignoreFieldChange: true
                });


                commRec.selectLine({
                    sublistId: 'line', line: 0
                });
                commRec.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'account',
                    value: 617

                });

                commRec.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'debit',
                    value: tot
                });
                commRec.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'entity',
                    value: ''

                });
                commRec.commitLine({
                    sublistId: 'line'
                });

                commRec.selectLine({
                    sublistId: 'line',
                    line: 1
                });
                commRec.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'account',
                    value: 751

                });

                commRec.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'credit',
                    value: tot
                });

                commRec.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'custbody_amz_partner',
                    value: invRec.getValue('partner')
                });

                commRec.commitLine({
                    sublistId: 'line'
                });
            } else {
                var split_Persons = [];
                var totalforSplit = 0
                var salesRep1 = invRec.getValue('custbodydfs_salesrep1_');
                var salesRep1_comm = invRec.getValue('custbodydfs_commission1_');
                log.debug("salesRep1 : ", salesRep1);
                log.debug("salesRep1_comm : ", salesRep1_comm);
                var salesRep2 = invRec.getValue('custbodydfs_salesrepb_');
                var salesRep2_comm = invRec.getValue('custbodydfs_commissionb_');

                var partner1 = invRec.getValue('custbodydfs_partnera_');
                var partner1_comm = invRec.getValue('custbodydfs_paacommission_');

                var partner2 = invRec.getValue('custbodydfs_partnerb_');
                var partner2_comm = invRec.getValue('custbodydfs_partnerbcom_');

                if (salesRep1 != "") {
                    split_Persons.push({
                        personId: parseInt(salesRep1),
                        comm_amt: parseFloat(salesRep1_comm),
                        comm_type: 1
                    })
                    totalforSplit += parseFloat(salesRep1_comm);
                }
                if (salesRep2 != "") {
                    split_Persons.push({
                        personId: parseInt(salesRep2),
                        comm_amt: parseFloat(salesRep2_comm),
                        comm_type: 1
                    })
                    totalforSplit += parseFloat(salesRep2_comm);
                }
                if (partner1 != "") {
                    split_Persons.push({
                        personId: parseInt(partner1),
                        comm_amt: parseFloat(partner1_comm),
                        comm_type: 2
                    })
                    totalforSplit += parseFloat(partner1_comm);
                }
                if (partner2 != "") {
                    split_Persons.push({
                        personId: parseInt(partner2),
                        comm_amt: parseFloat(partner2_comm),
                        comm_type: 2
                    })
                    totalforSplit += parseFloat(partner2_comm);
                }
                log.debug("split_Persons : ", split_Persons)
                log.debug("totalforSplit : ", totalforSplit)
                commRec.setValue({
                    fieldId: 'location',
                    value: invRec.getValue('location'),
                    ignoreFieldChange: true
                });


                commRec.setValue({
                    fieldId: 'department',
                    value: invRec.getValue('department'),
                    ignoreFieldChange: true
                });

                commRec.setValue({
                    fieldId: 'transtatus',
                    value: 'B',
                    ignoreFieldChange: true
                });

                var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

                var parsedDate = format.parse({ value: invRec.getValue('trandate'), type: format.Type.DATE });

                var postingPeriod = months[parsedDate.getMonth()] + ' ' + parsedDate.getFullYear();
                log.debug('postingPeriod', postingPeriod);

                var firstDay = new Date(parsedDate.getFullYear(), parsedDate.getMonth() + 1, 1);
                log.debug('firstDay', firstDay);

                commRec.setText({
                    fieldId: 'postingperiod',
                    value: postingPeriod,
                    ignoreFieldChange: true
                });

                commRec.setValue({
                    fieldId: 'trandate',
                    value: parsedDate,
                    ignoreFieldChange: true
                });

                commRec.setValue({
                    fieldId: 'custbody_amz_reversal_date',
                    value: firstDay,
                    ignoreFieldChange: true
                });

                commRec.setValue({
                    fieldId: 'custbody_amz_invoice_num',
                    value: context.newRecord.id,
                    ignoreFieldChange: true
                });


                commRec.selectNewLine({
                    sublistId: 'line'
                });
                commRec.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'account',
                    value: 617

                });

                commRec.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'debit',
                    value: totalforSplit
                });
                commRec.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'entity',
                    value: ''

                });
                commRec.commitLine({
                    sublistId: 'line'
                });
                for (var i = 0; i < split_Persons.length; i++) {
                    commRec.selectNewLine({
                        sublistId: 'line',
                    });
                    commRec.setCurrentSublistValue({
                        sublistId: 'line',
                        fieldId: 'account',
                        value: 751

                    });

                    commRec.setCurrentSublistValue({
                        sublistId: 'line',
                        fieldId: 'credit',
                        value: split_Persons[i].comm_amt
                    });
                    if(split_Persons[i].comm_type == 1){
                        log.debug("sales added successfully")
                        commRec.setCurrentSublistValue({
                            sublistId: 'line',
                            fieldId: 'custcol_amz_sales_rep_partner',
                            value: split_Persons[i].personId
                        });
                    }else{
                        log.debug("partner added successfully")
                        commRec.setCurrentSublistValue({
                            sublistId: 'line',
                            fieldId: 'custcol_lsk_partnerjecol',
                            value: split_Persons[i].personId
                        });
                    }

                    commRec.commitLine({
                        sublistId: 'line'
                    });
                }
            }
            var commissionRecSaveId = commRec.save({
                enableSourcing: true,
                ignoreMandatoryFields: true
            });

            log.debug("commissionRecSaveId : ", commissionRecSaveId);
            var otherId = record.submitFields({
                type: 'invoice',
                id: context.newRecord.id,
                values: {
                    'custbody_lsk_commjelink': commissionRecSaveId
                }
            });
            log.debug("commisssion link save invoice id : ", otherId);
        }
        // } catch (ex) {
        //     log.error(ex.name, ex.message);
        // }


    }

    return {

        afterSubmit: afterSubmit,

    }
});