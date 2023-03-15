/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 * @Author Jahnavi Chandaka
 */
define(['N/search','N/record','N/format'],

        function(search, record, format) {

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
           return search.create({
			   type: "invoice",
			   filters:
			   [
			      ["type","anyof","CustInvc"], 
			      "AND", 
			      ["mainline","is","T"], 
			      "AND", 
			      ["custbody_date_payment","isempty",""], 
			      "AND", 
			      ["status","anyof","CustInvc:B"],
                // "AND",
                 //["internalidnumber","equalto","10965"]
			   ],
			   columns:[
			   
			   ]
			});

        }catch(ex){
            log.error(ex.name, "getInputData: "+ex);
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

            var invId = mapsearchResult.id;
            log.debug('invId',invId);
          
             var customerpaymentSearchObj = search.create({
                type: "customerpayment",
                filters:
                    [
                     ["type","anyof","CustPymt"], 
                     "AND", 
                     ["appliedtotransaction.internalidnumber","equalto",invId]
                     ],
                     columns:
                         [
                          search.createColumn({
                              name: "trandate",
                              sort: search.Sort.DESC,
                              label: "Date"
                          })
                          ]
            }).run().getRange(0,1);
            //log.debug('customerpaymentSearchObj',customerpaymentSearchObj[0].getValue('trandate'))

            var depositapplicationSearchObj = search.create({
                type: "depositapplication",
                filters:
                    [
                     ["type","anyof","DepAppl"], 
                     "AND", 
                     ["appliedtotransaction.internalidnumber","equalto",invId]
                     ],
                     columns:
                         [
                          search.createColumn({name: "trandate",
                              sort: search.Sort.DESC, label: "Date"})
                              ]
            }).run().getRange(0,1);

            if(customerpaymentSearchObj.length>0){
                var parsed_Date = format.parse({value:customerpaymentSearchObj[0].getValue('trandate'), type: format.Type.DATE});
            }else if(depositapplicationSearchObj.length>0){
                var parsed_Date = format.parse({value:depositapplicationSearchObj[0].getValue('trandate'), type: format.Type.DATE});
            } 

            if(parsed_Date){    
                record.submitFields({ type: record.Type.INVOICE,
                    id:invId,
                    values: {
                                custbody_date_payment : parsed_Date?parsed_Date:''
                    },
                    options: {
                        enableSourcing: false,
                        ignoreMandatoryFields : true
                    }
                });
            }

        }catch(ex){
            log.error(ex.name, "map: "+ex);
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
        //summarize: summarize
    };

});