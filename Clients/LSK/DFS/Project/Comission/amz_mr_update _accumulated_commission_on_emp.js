/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 * @Author Jahnavi Chandaka
 */
define(['N/record','N/format','N/search'],

        function(record, format, search) {

    /**
     * Marks the beginning of the Map/Reduce process and generates input data.
     *
     * @typedef {Object} ObjectRef
     * @property {number} id - Internal ID of the record instance
     * @property {string} type - Record type id
     *
     * @return {Array|Object|Search|RecordRef} inputSummary
     * @since 2015.1
     */
    function getInputData() {
        try{
            var transactionSearchObj = search.create({
                type: "transaction",
                filters:
                    [
                     ["type","anyof","Custom100"], 
                     "AND", 
                     ["trandate","within","lastmonth"], 
                     "AND", 
                     ["creditamount","greaterthan","0.00"],
                     "AND",
                     ["mainline","is","T"]
                     ],
                     columns:
                         [
                          search.createColumn({
                              name: "custbody_amz_sales_rep",
                              summary: "GROUP",
                              label: "Sales Rep"
                          }),
                          search.createColumn({
                             name: "custbody_amz_partner",
                             summary: "GROUP",
                             label: "Partner"
                          })
                        ]
            });
            return transactionSearchObj;

        }catch(ex){
            log.error(ex.name,ex.message);
        }
    }
    /**
     * Executes when the map entry point is triggered and applies to each key/value pair.
     *
     * @param {MapSummary} context - Data collection containing the key/value pairs to process through the map stage
     * @since 2015.1
     */
    function map(context) { 
        try{
            var mapsearchResult = JSON.parse(context.value);
            log.debug('mapsearchResult',mapsearchResult);

            var date = new Date();
            date.setDate(date.getDate() - 1);
            log.debug('date',date);

            var month = date.getMonth();
          
          /*var parsedDate = format.parse({value:date, type: format.Type.DATE});
          
			var firstDay = new Date(parsedDate.getFullYear(), parsedDate.getMonth()-2, 1);*/

            var emp_name = mapsearchResult.values["GROUP(custbody_amz_sales_rep)"].value;
            log.debug('emp_name',emp_name);
          
          var partner_name = mapsearchResult.values["GROUP(custbody_amz_partner)"].value;
            log.debug('partner_name',partner_name);
          
          if(emp_name){
            var customrecord921SearchObj = search.create({
                type: "customrecord921",
                filters:
                    [
                     ["custrecord_amz_dfs_com_date","within","lastmonth"], 
                     "AND", 
                     ["custrecord_amz_dfs_com_emp","anyof",emp_name]
                     ],
                     columns:
                         [
                          search.createColumn({name: "custrecord_amz_dfs_com_acc_comm", label: "Accumulated Commission "})
                          ]
            }).runPaged().count;
        }else if(partner_name){
        	var customrecord921SearchObj = search.create({
                type: "customrecord921",
                filters:
                    [
                     ["custrecord_amz_dfs_com_date","within","lastmonth"], 
                     "AND",                      
                     ["custrecord_amz_dfs_com_partner","anyof",partner_name]
                     ],
                     columns:
                         [
                          search.createColumn({name: "custrecord_amz_dfs_com_acc_comm", label: "Accumulated Commission "})
                          ]
            }).runPaged().count;
        }

            if(customrecord921SearchObj == 0){
            	if(emp_name){
                var commtransactionSearchObj = search.create({
                    type: "transaction",
                    filters:
                        [
                         ["type","anyof","Custom100"], 
                         "AND", 
                         ["custbody_amz_sales_rep","anyof",emp_name],
                         "AND", 
                         ["trandate","within","lastmonth"]
                         ],
                         columns:
                             [
                              search.createColumn({
                                  name: "creditamount",
                                  summary: "SUM",
                                  label: "Amount (Credit)"
                              })
                              ]
                }).run().getRange(0,1);
              }else if(partner_name){
              		var commtransactionSearchObj = search.create({
                    type: "transaction",
                    filters:
                        [
                         ["type","anyof","Custom100"], 
                         "AND", 
                         ["custbody_amz_partner","anyof",partner_name],
                         "AND", 
                         ["trandate","within","lastmonth"]
                         ],
                         columns:
                             [
                              search.createColumn({
                                  name: "creditamount",
                                  summary: "SUM",
                                  label: "Amount (Credit)"
                              })
                              ]
                }).run().getRange(0,1);
             }

                var amt = commtransactionSearchObj[0].getValue({
                    name: "creditamount",
                    summary: "SUM",
                    label: "Amount (Credit)"
                });
                log.debug('amt',amt);

                if(month !=10){
                	if(emp_name){
	                    var customrecord921SearchObj = search.create({
	                        type: "customrecord921",
	                        filters:
	                            [
	                             ["custrecord_amz_dfs_com_date","within","monthbeforelast"], 
	                             "AND", 
	                             ["custrecord_amz_dfs_com_emp","anyof",emp_name]
	                             ],
	                             columns:
	                                 [
	                                  search.createColumn({name: "custrecord_amz_dfs_com_acc_comm", label: "Accumulated Commission "})
	                                  ]
	                    }).run().getRange(0,1); 
	                 }else if(partner_name){

	                 	var customrecord921SearchObj = search.create({
	                        type: "customrecord921",
	                        filters:
	                            [
	                             ["custrecord_amz_dfs_com_date","within","monthbeforelast"], 
			                     "AND", 
			                     ["custrecord_amz_dfs_com_partner","anyof",partner_name]
	                             ],
	                             columns:
	                                 [
	                                  search.createColumn({name: "custrecord_amz_dfs_com_acc_comm", label: "Accumulated Commission "})
	                                  ]
	                    }).run().getRange(0,1); 
	                 }       
                    if(customrecord921SearchObj.length > 0){
                        var accum_comm = customrecord921SearchObj[0].getValue({name: "custrecord_amz_dfs_com_acc_comm", label: "Accumulated Commission "});
                        log.debug('accum_comm',accum_comm);

                        var acc_comm = Number(accum_comm) + Number(amt);
                        log.debug('acc_comm',acc_comm);
                    }else{
                        var acc_comm = Number(amt);
                        log.debug('acc_comm',acc_comm);          
                    }
                }else{
                    var acc_comm = Number(amt);
                    log.debug('acc_comm',acc_comm);  
                }
                var commRec = record.create({
                    type: 'customrecord921',
                    isDynamic: true
                });
                log.debug('commRec',commRec);
              
if(emp_name){
                commRec.setValue({
                    fieldId: 'custrecord_amz_dfs_com_emp',
                    value: emp_name,
                    ignoreFieldChange: true
                });
}else{             
              commRec.setValue({
                    fieldId: 'custrecord_amz_dfs_com_partner',
                    value: partner_name,
                    ignoreFieldChange: true
                });
}
                commRec.setValue({
                    fieldId: 'custrecord_amz_dfs_com_month_comm',
                    value: amt,
                    ignoreFieldChange: true
                });

                commRec.setValue({
                    fieldId: 'custrecord_amz_dfs_com_date',
                    value: date,
                    ignoreFieldChange: true
                });

                commRec.setValue({
                    fieldId: 'custrecord_amz_dfs_com_acc_comm',
                    value: acc_comm,
                    ignoreFieldChange: true
                });             

                if(emp_name == 16 || emp_name == 9659){
                    if(emp_name == 16){

                        var guar_amt = 50000;
                      
                      commRec.setValue({
                        fieldId: 'custrecord_amz_dfs_com_grantee',
                        value: guar_amt,
                        ignoreFieldChange: true
                    }); 

                    }else if(emp_name == 9659){

                        var guar_amt = 24000;
                      
                      commRec.setValue({
                        fieldId: 'custrecord_amz_dfs_com_grantee',
                        value: guar_amt,
                        ignoreFieldChange: true
                    }); 

                    }

                    if(acc_comm > guar_amt){

                        var monthly_amt = amt + (guar_amt/12);

                    }else if(acc_comm < guar_amt){

                        var monthly_amt = guar_amt/12;

                    }
                commRec.setValue({
                    fieldId: 'custrecord_amz_monthly_commission',
                    value: monthly_amt,
                    ignoreFieldChange: true
                });
                }

                var commid = commRec.save(); 

                if(commid && (acc_comm < guar_amt)){
                 
                    var commtransactionSearchObj = search.create({
                       type: "transaction",
                       filters:
                       [
                          ["type","anyof","Custom100"], 
                          "AND", 
                          ["reversaldate","isempty",""],
                         "AND", 
   ["custbody_amz_sales_rep","anyof","16","9659"],
                          "AND", 
                          ["mainline","is","T"], 
                          "AND", 
                          ["trandate","before","today"]
                       ],
                       columns:
                       [
                          search.createColumn({name: "trandate", label: "Date"}),
                         search.createColumn({name: "internalid", label: "Internal ID"})
                       ]
                    }).run().each(function(result){

                            var comm_date = result.getValue({
                               name: "trandate", label: "Date"
                            });
                            log.debug('comm_date',comm_date);

                             var comm_parsedDate = format.parse({value:comm_date, type: format.Type.DATE});

                            record.submitFields({ type: 'customtransaction_amz_commission',
                                id: result.getValue({
                               name: "internalid", label: "Internal ID"
                            }),
                                values: {
                                    custbody_amz_reversal_date : new Date(comm_parsedDate.getFullYear(), comm_parsedDate.getMonth()+1, 1)
                                },
                                options: {
                                    enableSourcing: false,
                                    ignoreMandatoryFields : true
                                }
                            });
                       return true;
                    });
                    
                }
            }
        }catch(ex){
            log.error(ex.name,ex);
        }
    }
    /**
     * Executes when the reduce entry point is triggered and applies to each group.
     *
     * @param {ReduceSummary} context - Data collection containing the groups to process through the reduce stage
     * @since 2015.1
     */
    function reduce(context) {

    }


    /**
     * Executes when the summarize entry point is triggered and applies to the result set.
     *
     * @param {Summary} summary - Holds statistics regarding the execution of a map/reduce script
     * @since 2015.1
     */
    function summarize(summary) {

    }

    return {
        getInputData: getInputData,
        map: map,
        //reduce: reduce,
        summarize: summarize
    };

});
