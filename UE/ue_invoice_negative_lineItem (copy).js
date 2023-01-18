/**
 *
 * @NScriptType UserEventScript
 * @NApiVersion 2.x
 */

 define(['N/record'], function (record) {
    function beforeSubmit(context) {
        if (context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT) {
            var newRecord = context.newRecord;

            var invoiceLineItemCount = newRecord.getLineCount({ sublistId: 'item' });
			var chkNegLine = newRecord.getValue({ fieldId: 'custbody_invoice_negative_processed' })
			log.debug('chkNegLine : ' + chkNegLine)
            var falseLineCount = 0
            for (var i = 0; i < invoiceLineItemCount; i++) {

                var itemId = newRecord.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'item',
                    line: i,
                })

                var subscriptioId = newRecord.getSublistValue({
                    'sublistId': 'item',
                    'fieldId': 'subscription',
                    'line': i,
                })

                if (subscriptioId !== "") {

                    var processed = newRecord.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcolprocessed_split',
                        line: i,
                    })

                    var subscriptionRec = record.load({
                        'type': 'subscription',
                        'id': subscriptioId,
                        'isDynamic': true,
                    })
                    var subscriptionLineCount = subscriptionRec.getLineCount({ sublistId: 'subscriptionline' });
                    //log.debug('subscriptionLineCount : ' + subscriptionLineCount)
                    for (var j = 0; j < subscriptionLineCount; j++) {
                        var subscriptionItem = subscriptionRec.getSublistValue({
                            sublistId: 'subscriptionline',
                            fieldId: 'item',
                            line: j,
                        })
                        var subscriptionIsActive = subscriptionRec.getSublistValue({
                            sublistId: 'subscriptionline',
                            fieldId: 'status',
                            line: j,
                        })
                        //log.debug('subscriptionIsActive : ' + subscriptionIsActive)

                        if (subscriptionItem === itemId && subscriptionIsActive == 'ACTIVE') {
                            var subscriptionLineId = subscriptionRec.getSublistValue({
                                sublistId: 'subscriptionline',
                                fieldId: 'subscriptionline',
                                line: j,
                            })

                            var subscriptionLineRec = record.load({
                                type: 'subscriptionline',
                                id: subscriptionLineId,
                                isDynamic: true,
                            })




                            var pb_amount = subscriptionLineRec.getValue({ 'fieldId': 'custrecord_subsline_bp_amount' });
                            var calcu = subscriptionLineRec.getValue({ 'fieldId': 'custrecord_subsline_calculation' });
                            //log.debug('pb_amount : ' + typeof pb_amount)
                            if ((pb_amount != 0 || pb_amount != "") && calcu == 'Split') {
                                if ((itemId === '416' || itemId === '414') && processed == false) {

                                    falseLineCount += 1
                                }
                            }

                        }

                    }
                }

            }

            log.debug('invoiceLineItemCount : ' + invoiceLineItemCount)
            log.debug('falseLineCount : ' + falseLineCount)

            for (var i = 0; i < invoiceLineItemCount + falseLineCount; i++) {
                log.debug('loop : ' + i)
                var itemId = newRecord.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'item',
                    line: i,
                })

                var subscriptioId = newRecord.getSublistValue({
                    'sublistId': 'item',
                    'fieldId': 'subscription',
                    'line': i,
                })
                //subscriptioId = parseInt(subscriptioId)
                //log.debug('subscriptioId : ' + subscriptioId)



                var processed = newRecord.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcolprocessed_split',
                    line: i,
                })
                var line = newRecord.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'line',
                    line: i,
                })

                //log.debug('procressed : ' + processed)
                line = parseInt(line)
                //log.debug('itemId : ' + itemId)
                //log.debug('line : ' + line)

                if (subscriptioId !== "") {
                    //log.debug('entered NaN')
                    var values = getPB_AmountAndCalcMthd(itemId, subscriptioId)
                    if ((values.pb_amount != 0 || values.pb_amount != "") && values.calculation == 'Split') {
                        if ((itemId == 416 || itemId == 414) && processed == false) {
                            //if (subscriptioId != '') {
                            // log.debug('entered in false : ')
                            setOnCreateAndEdit(i, itemId, processed, newRecord)
                            //}

                        }
                        else if ((itemId == 416 || itemId == 414) && processed == true) {
                            //log.debug('entered in true : ')
                            //if (subscriptioId != '') {
                            setOnCreateAndEdit(i, itemId, processed, newRecord)
                            //}

                        }
                    }

                }

            }

            //record save

            //loop for negative line record
            var invoiceLineItemCountForInvCreation = newRecord.getLineCount({ sublistId: 'item' });
            var splitInvoiceData = []
            var rebateInvoiceData = []

            //getting data for fleet management
            var invoiceLineItemCount = newRecord.getLineCount({ sublistId: 'item' });
         	for (var i = 0; i < invoiceLineItemCountForInvCreation; i++) {

                var itemId = newRecord.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'item',
                    line: i,
                })

                var subscriptioId = newRecord.getSublistValue({
                    'sublistId': 'item',
                    'fieldId': 'subscription',
                    'line': i,
                })

                var processed = newRecord.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcolprocessed_split',
                    line: i,
                })

                if (subscriptioId === "") {
					var subscriptioIdrecordLoad = newRecord.getSublistValue({
                    'sublistId': 'item',
                    'fieldId': 'subscription',
                    'line': i -1,
                })
                    var subscriptionRec = record.load({
                        'type': 'subscription',
                        'id': subscriptioIdrecordLoad,
                        'isDynamic': true,
                    })
                    var subscriptionLineCount = subscriptionRec.getLineCount({ sublistId: 'subscriptionline' });
                    //log.debug('subscriptionLineCount : ' + subscriptionLineCount)
                    for (var j = 0; j < subscriptionLineCount; j++) {
                        var subscriptionItem = subscriptionRec.getSublistValue({
                            sublistId: 'subscriptionline',
                            fieldId: 'item',
                            line: j,
                        })
                        var subscriptionIsActive = subscriptionRec.getSublistValue({
                            sublistId: 'subscriptionline',
                            fieldId: 'status',
                            line: j,
                        })
                        //log.debug('subscriptionIsActive : ' + subscriptionIsActive)

                        if (subscriptionItem === itemId && subscriptionIsActive == 'ACTIVE') {
                            var subscriptionLineId = subscriptionRec.getSublistValue({
                                sublistId: 'subscriptionline',
                                fieldId: 'subscriptionline',
                                line: j,
                            })

                            var subscriptionLineRec = record.load({
                                type: 'subscriptionline',
                                id: subscriptionLineId,
                                isDynamic: true,
                            })



							 var calc_method = subscriptionLineRec.getValue({ 'fieldId': 'custrecord_subsline_cal_method' });
                          	var calcu = subscriptionLineRec.getValue({ 'fieldId': 'custrecord_subsline_calculation' });
                            var discountRateCap = subscriptionLineRec.getValue({ 'fieldId': 'custrecord_subsline_disc_r_cap' });
                            var pb_per = subscriptionLineRec.getValue({ 'fieldId': 'custrecord_subsline_cal_per' });
                            var pb_amount = subscriptionLineRec.getValue({ 'fieldId': 'custrecord_subsline_bp_amount' });
							var withAccount = subscriptionLineRec.getValue({ 'fieldId': 'custrecord_subsline_withacc' });
                            
                           

                            //log.debug('pb_amount : ' + typeof pb_amount)

                            var Qty = newRecord.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'quantity',
                                line: i,

                            });

                            var rate = newRecord.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'rate',
                                line: i
                            });
                            var amount = newRecord.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'amount',
                                line: i
                            });
                          	var taxcode = newRecord.getSublistValue({
           						 sublistId: 'item',
          						  fieldId: 'taxcode',
           						 line: i,
     						   })


                            splitInvoiceData.push({
                                 		'Qty': Qty ,
                                        'unitCost': rate ,
                                		 'amount': amount ,
                                        'itemId': itemId,
                                        'subscriptioId': subscriptionLineId,
                                		'withAccount': withAccount,
                                        'taxcode':taxcode,
                                        'pb_amount' : pb_amount,
                                        'pb_per' : pb_per,
                                        'calc_method': calc_method,
                                        'calcu' : calcu,
                                       
                            })



                        }

                    }
                }

            }

            //getting data for connected car services
            var invoiceLineItemCount = newRecord.getLineCount({ sublistId: 'item' });
            for (var i = 0; i < invoiceLineItemCount; i++) {

                var itemId = newRecord.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'item',
                    line: i,
                })

                var subscriptioId = newRecord.getSublistValue({
                    'sublistId': 'item',
                    'fieldId': 'subscription',
                    'line': i,
                })

                var processed = newRecord.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcolprocessed_split',
                    line: i,
                })

                if (subscriptioId !== "" && processed == false) {



                    var subscriptionRec = record.load({
                        'type': 'subscription',
                        'id': subscriptioId,
                        'isDynamic': true,
                    })
                    var subscriptionLineCount = subscriptionRec.getLineCount({ sublistId: 'subscriptionline' });
                    //log.debug('subscriptionLineCount : ' + subscriptionLineCount)
                    for (var j = 0; j < subscriptionLineCount; j++) {
                        var subscriptionItem = subscriptionRec.getSublistValue({
                            sublistId: 'subscriptionline',
                            fieldId: 'item',
                            line: j,
                        })
                        var subscriptionIsActive = subscriptionRec.getSublistValue({
                            sublistId: 'subscriptionline',
                            fieldId: 'status',
                            line: j,
                        })
                        //log.debug('subscriptionIsActive : ' + subscriptionIsActive)

                        if (subscriptionItem === itemId && subscriptionIsActive == 'ACTIVE') {
                            var subscriptionLineId = subscriptionRec.getSublistValue({
                                sublistId: 'subscriptionline',
                                fieldId: 'subscriptionline',
                                line: j,
                            })

                            var subscriptionLineRec = record.load({
                                type: 'subscriptionline',
                                id: subscriptionLineId,
                                isDynamic: true,
                            })




                            var calc_method = subscriptionLineRec.getValue({ 'fieldId': 'custrecord_subsline_cal_method' });
                          	var calcu = subscriptionLineRec.getValue({ 'fieldId': 'custrecord_subsline_calculation' });
                            var discountRateCap = subscriptionLineRec.getValue({ 'fieldId': 'custrecord_subsline_disc_r_cap' });
                            var pb_per = subscriptionLineRec.getValue({ 'fieldId': 'custrecord_subsline_cal_per' });
                            var pb_amount = subscriptionLineRec.getValue({ 'fieldId': 'custrecord_subsline_bp_amount' });
							var withAccount = subscriptionLineRec.getValue({ 'fieldId': 'custrecord_subsline_withacc' });
                          	log.debug('pb_amount' , pb_amount)
                            //log.debug('pb_amount : ' + typeof pb_amount)
                            if ((pb_amount != 0 || pb_amount != "" ) && calcu == 'Rebate') {
                                if ((itemId === '416' || itemId === '414')) {
                                    var Qty = newRecord.getSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'quantity',
                                        line: i,

                                    });

                                    var rate = newRecord.getSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'rate',
                                        line: i
                                    });
                                    var amount = newRecord.getSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'amount',
                                        line: i
                                    });
                                  var taxcode = newRecord.getSublistValue({
        							    sublistId: 'item',
          							  fieldId: 'taxcode',
          								  line: i,
     									   })
                                    var values = calculation(calc_method, discountRateCap, pb_per, pb_amount, Qty, rate)
								
                                      rebateInvoiceData.push({
                                        'Qty': Qty ,
                                        'unitCost': values.unitCost ,
                                		 'amount': values.split ,
                                        'itemId': itemId,
                                        'subscriptioId': subscriptioId,
                                		'withAccount': withAccount,
                                        'taxcode':taxcode,
                                        'pb_amount' : pb_amount,
                                        'pb_per' : pb_per,
                                        'calc_method': calc_method,
                                        'calcu' : calcu,
                                     
                                        

                                    })
                                }
                            }

                        }

                    }
                }

            }
          
           log.debug('splitInvoiceData' , splitInvoiceData)
          log.debug('rebateInvoiceData' , rebateInvoiceData)
          
          
            if (rebateInvoiceData.length > 0) {
                //createInvoiceForCustomer(rebateInvoiceData)
            }
            if (splitInvoiceData.length > 0) {
                //createInvoiceForCustomer(splitInvoiceData)
            }
        }
    }

	function createInvoiceForCustomer(recordValue) {
        var invRec = record.create({
            type: record.Type.INVOICE,
            isDynamic: true,

        });
     
      log.debug('recordValue' , recordValue)
        invRec.setValue({fieldId: "entity", value: parseInt(recordValue[0].withAccount) });
		for (var j = 0; j < recordValue.length; j++) {
        		  var amount = recordValue[j].amount
              	var unitcost =  recordValue[j].unitCost
              	if(amount < 0){
                  amount = amount * -1
                }
              	if(unitcost < 0){
                  unitcost = amount* -1
                }
         		
            invRec.selectNewLine({ sublistId: "item" });
           
            //invRec.setCurrentSublistValue({ sublistId: "item", fieldId: "subscription", value: recordValue[j].subscriptioId });
            invRec.setCurrentSublistValue({ sublistId: "item", fieldId: "item", value: recordValue[j].itemId });
            invRec.setCurrentSublistValue({ sublistId: "item", fieldId: "quantity", value: recordValue[j].Qty });
          	invRec.setCurrentSublistValue({ sublistId: "item", fieldId: "taxcode", value: recordValue[j].taxcode });
          	invRec.setCurrentSublistValue({ sublistId: "item", fieldId: "rate", value: recordValue[j].unitCost });
          	invRec.setCurrentSublistValue({ sublistId: "item", fieldId: "amount", value: recordValue[j].amount });
           
          	invRec.commitLine({ sublistId: 'item' }); 

        }
        
        
        var invoiceId = invRec.save()
      	log.debug('invoiceId : ' + invoiceId)
      log.debug('invoice created Successfully' )
    }

    function setOnCreateAndEdit(i, itemId, processed, newRecord) {
        var Qty = newRecord.getSublistValue({
            sublistId: 'item',
            fieldId: 'quantity',
            line: i,

        });

        var rate = newRecord.getSublistValue({
            sublistId: 'item',
            fieldId: 'rate',
            line: i
        });
        var subscriptioId = newRecord.getSublistValue({
            'sublistId': 'item',
            'fieldId': 'subscription',
            'line': i,
        })
        //log.debug('subscriptioId : ' + subscriptioId)

        var subscriptionRec = record.load({
            'type': 'subscription',
            'id': subscriptioId,
            'isDynamic': true,
        })
        var subscriptionLineCount = subscriptionRec.getLineCount({ sublistId: 'subscriptionline' });
        //log.debug('subscriptionLineCount : ' + subscriptionLineCount)
        for (var j = 0; j < subscriptionLineCount; j++) {
            var subscriptionItem = subscriptionRec.getSublistValue({
                sublistId: 'subscriptionline',
                fieldId: 'item',
                line: j,
            })
            var subscriptionIsActive = subscriptionRec.getSublistValue({
                sublistId: 'subscriptionline',
                fieldId: 'status',
                line: j,
            })
            //log.debug('subscriptionIsActive : ' + subscriptionIsActive)

            if (subscriptionItem === itemId && subscriptionIsActive == 'ACTIVE') {
                var subscriptionLineId = subscriptionRec.getSublistValue({
                    sublistId: 'subscriptionline',
                    fieldId: 'subscriptionline',
                    line: j,
                })

                var subscriptionLineRec = record.load({
                    type: 'subscriptionline',
                    id: subscriptionLineId,
                    isDynamic: true,
                })


                var calc_method = subscriptionLineRec.getValue({ 'fieldId': 'custrecord_subsline_cal_method' });
                var discountRateCap = subscriptionLineRec.getValue({ 'fieldId': 'custrecord_subsline_disc_r_cap' });
                var pb_per = subscriptionLineRec.getValue({ 'fieldId': 'custrecord_subsline_cal_per' });
                var pb_amount = subscriptionLineRec.getValue({ 'fieldId': 'custrecord_subsline_bp_amount' });


                var calculatedValue = calculation(calc_method, discountRateCap, pb_per, pb_amount, Qty, rate)

                setValue(i, itemId, processed, Qty, calculatedValue.split, calculatedValue.unitCost, newRecord)


              
            }

        }

    }

    function getPB_AmountAndCalcMthd(itemId, subscriptioId) {
        var pbAmountAndCalMethod = {}

        var subscriptionRec = record.load({
            'type': 'subscription',
            'id': subscriptioId,
            'isDynamic': true,
        })
        var subscriptionLineCount = subscriptionRec.getLineCount({ sublistId: 'subscriptionline' });
        //log.debug('subscriptionLineCount : ' + subscriptionLineCount)
        for (var j = 0; j < subscriptionLineCount; j++) {
            var subscriptionItem = subscriptionRec.getSublistValue({
                sublistId: 'subscriptionline',
                fieldId: 'item',
                line: j,
            })
            var subscriptionIsActive = subscriptionRec.getSublistValue({
                sublistId: 'subscriptionline',
                fieldId: 'status',
                line: j,
            })
            //log.debug('subscriptionIsActive : ' + subscriptionIsActive)

            if (subscriptionItem === itemId && subscriptionIsActive == 'ACTIVE') {
                var subscriptionLineId = subscriptionRec.getSublistValue({
                    sublistId: 'subscriptionline',
                    fieldId: 'subscriptionline',
                    line: j,
                })

                var subscriptionLineRec = record.load({
                    type: 'subscriptionline',
                    id: subscriptionLineId,
                    isDynamic: true,
                })



                pbAmountAndCalMethod['pb_amount'] = subscriptionLineRec.getValue({ 'fieldId': 'custrecord_subsline_bp_amount' });
                pbAmountAndCalMethod['calculation'] = subscriptionLineRec.getValue({ 'fieldId': 'custrecord_subsline_calculation' });

            }

        }

        return pbAmountAndCalMethod
    }



    function calculation(calc_method, discountRateCap, pb_per, pb_amount, Qty, rate) {

        var split = 0
        var unitCost = 0

        var calcualatedValue = {}
        if (calc_method == 'Flat') {
            if (pb_per == "Total") {
                split = pb_amount * -1
                unitCost = (split / Qty)
            } else if (pb_per == "Each") {
                split = Qty * pb_amount * -1
                unitCost = (split / Qty)
            }
        }
        else {
            if (Qty <= discountRateCap || discountRateCap == 0) {

                split = ((pb_amount / 100) * Qty * rate) * -1
                unitCost = (split / Qty)
            }
            else {

                split = (discountRateCap * rate * (pb_amount / 100)) + ((Qty - discountRateCap) * rate) * -1
                unitCost = (split / Qty)
            }
        }

        calcualatedValue['split'] = split
        calcualatedValue['unitCost'] = unitCost

        return calcualatedValue

    }

    function setValue(i, itemId, processed, Qty, split, unitCost, newRecord) {
        var taxcode = newRecord.getSublistValue({
            sublistId: 'item',
            fieldId: 'taxcode',
            line: i,
        })


        if (processed == false) {

            try {
                processed = true
                newRecord.setSublistValue({ sublistId: "item", fieldId: "custcolprocessed_split", line: i, value: processed });
                var l = i + 1;
                newRecord.insertLine({ sublistId: "item", line: l });
                newRecord.setSublistValue({ sublistId: "item", fieldId: "item", line: l, value: itemId });
                newRecord.setSublistValue({ sublistId: "item", fieldId: "quantity", line: l, value: Qty });
                newRecord.setSublistValue({ sublistId: "item", fieldId: "rate", line: l, value: unitCost });
                newRecord.setSublistValue({ sublistId: "item", fieldId: "amount", line: l, value: split });
                newRecord.setSublistValue({ sublistId: "item", fieldId: "taxcode", line: l, value: taxcode });
                newRecord.setSublistValue({ sublistId: "item", fieldId: "custcolprocessed_split", line: l, value: processed });
                //log.debug('unit : ' + unitCost)
                //log.debug('split : ' + split)
                //newRecord.save()                                                                   
            } catch (e) {
                log.debug(e)
            }

        }
        else {
            processed = true
            var l = i + 1;
            try {
                newRecord.setSublistValue({ sublistId: "item", fieldId: "item", line: l, value: itemId });
                newRecord.setSublistValue({ sublistId: "item", fieldId: "quantity", line: l, value: Qty });
                newRecord.setSublistValue({ sublistId: "item", fieldId: "rate", line: l, value: unitCost });
                newRecord.setSublistValue({ sublistId: "item", fieldId: "amount", line: l, value: split });
                newRecord.setSublistValue({ sublistId: "item", fieldId: "taxcode", line: l, value: taxcode });
                newRecord.setSublistValue({ sublistId: "item", fieldId: "custcolprocessed_split", line: l, value: processed });
                //log.debug('unit : ' + unitCost)
                //log.debug('split : ' + split)
                //newRecord.save()                                                                   
            } catch (e) {
                log.debug(e)
            }
        }




    }
    return {
        beforeSubmit: beforeSubmit
    }


})