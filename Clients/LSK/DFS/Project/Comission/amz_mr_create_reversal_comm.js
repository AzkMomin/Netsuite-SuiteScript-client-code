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
			      ["custbody_amz_reversal_date","isnotempty",""], 
			      "AND", 
			      ["custbody_amz_sales_rep","anyof","16","9659"], 
			      "AND", 
			      ["mainline","is","T"], 
			      "AND", 
			      ["trandate","onorbefore","today"], 
			      "AND", 
			      ["custbody_amz_reversal_checked","is","F"], 
                  "AND", 
                  ["creditamount","greaterthan","0.00"],
                 "AND",
                 ["internalidnumber","equalto","27394"]
			   ],
			   columns:
			   [
			      search.createColumn({name: "subsidiary", label: "Subsidiary"}),
			      search.createColumn({name: "location", label: "Location"}),
			      search.createColumn({name: "custbody_amz_sales_rep", label: "Sales Rep"}),
			      search.createColumn({name: "creditamount", label: "Amount (Credit)"})
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

			var subs = mapsearchResult.values.subsidiary.value;

            var loc = mapsearchResult.values.location.value;
            log.debug('loc',loc);

            var sales_rep = mapsearchResult.values.custbody_amz_sales_rep.value;
            log.debug('sales_rep',sales_rep);

            var amt = mapsearchResult.values.creditamount;
            log.debug('amt',amt);

			    var commRec = record.create({
					type: 'customtransaction_amz_commission',
					isDynamic: true                       
				});
				log.debug('commRec',commRec);

				commRec.setValue({
					fieldId: 'subsidiary',
					value: subs,
					ignoreFieldChange: true
				});
              
              commRec.setValue({
					fieldId: 'custbody_amz_sales_rep',
					value: sales_rep,
					ignoreFieldChange: true
				});
              
              commRec.setValue({
					fieldId: 'location',
					value: loc,
					ignoreFieldChange: true
				});

				commRec.setValue({
					fieldId: 'transtatus',
					value: 'B',
					ignoreFieldChange: true
				}); 

				var lineNum = commRec.selectLine({
					sublistId: 'line',line:0
				});
				commRec.setCurrentSublistValue({
					sublistId: 'line',
					fieldId: 'account',
					value: 751
				});

				commRec.setCurrentSublistValue({
					sublistId: 'line',
					fieldId: 'debit',
					value: amt
				});
				commRec.setCurrentSublistValue({
					sublistId: 'line',
					fieldId: 'entity',
					value:''

				});
				commRec.commitLine({
					sublistId: 'line'
				});

				var lineNum = commRec.selectLine({
					sublistId: 'line',
					line:1
				});
				commRec.setCurrentSublistValue({
					sublistId: 'line',
					fieldId: 'account',
					value: 617

				});

				commRec.setCurrentSublistValue({
					sublistId: 'line',
					fieldId: 'credit',
					value: amt
				});
				commRec.setCurrentSublistValue({
					sublistId: 'line',
					fieldId: 'entity',
					value:''

				});
				commRec.commitLine({
					sublistId: 'line'
				});

				var link = commRec.save({enableSourcing: true,
					ignoreMandatoryFields: true
				});

				if(link){

					record.submitFields({ type: 'customtransaction_amz_commission',
                                id: mapsearchResult.id,
                                values: {
                                    custbody_amz_reversal_checked : true
                                },
                                options: {
                                    enableSourcing: false,
                                    ignoreMandatoryFields : true
                                }
                            });
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
