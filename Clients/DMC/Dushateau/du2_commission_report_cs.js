/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/url', 'N/search'],

function(url, search) {
    
    /**
     * Function to be executed after page is initialized.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
     *
     * @since 2015.2
     */
    function pageInit(scriptContext) {
    	console.log("PAGE INIT");
    	log.debug("DEBUG", "PAGE INIT");
    }

    /**
     * Function to be executed when field is changed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
     * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
     *
     * @since 2015.2
     */
    function fieldChanged(scriptContext) {
    	console.log("fieldChanged");

    	try {		
        	console.log("fieldChanged 2");
	
			var currentRecord = scriptContext.currentRecord;
	    	console.log("FIELD", scriptContext.fieldId);
	
	    	
	    	// Navigate to selected page
	        if (scriptContext.fieldId == 'custpage_pageid') {
	            var pageId = currentRecord.getValue('custpage_pageid');
	            pageId = parseInt(pageId.split('_')[1]);
	
	            document.location = url.resolveScript({
	                    scriptId : getParameterFromURL('script'),
	                    deploymentId : getParameterFromURL('deploy'),
	                    params : {
	                        'page' : pageId
	                    }
	                });
	        }
	        
	        
	        
	        if (scriptContext.fieldId == 'datefrom' || scriptContext.fieldId == 'dateto') {
	            var dateFrom = currentRecord.getValue('datefrom');
		        var dateTo = currentRecord.getValue('dateto');
	
	            document.location = url.resolveScript({
	                    scriptId : getParameterFromURL('script'),
	                    deploymentId : getParameterFromURL('deploy'),
	                    params : {
	                        'datefrom' : dateFrom,
	                        'dateto' : dateTo,
	                    }
	                });
	        }
	        
	        
	        
	        
	        if (scriptContext.fieldId == 'postingperiod') {
	            document.location = url.resolveScript({
	                    scriptId : getParameterFromURL('script'),
	                    deploymentId : getParameterFromURL('deploy'),
	                    params : {
	                        'postingperiod' : currentRecord.getValue('postingperiod'),
	                    }
	                });
	        }
	        
	        /*
	        var suiteletURL = url.resolveScript({
				scriptId: 'customscript_du_commission_report_sl',
				deploymentId: 'customdeploy_du_commission_report_sl',
				returnExternalUrl: false,
				//params: {'internalid': currentRecordId, 'recordtype' : currentRecordType}
			});
	        location.reload(suiteletURL);
	        */
	        
	        return true;

	        
    	}
    	catch (e) {
    		log.error("ERROR Exception: " + e.message, e);
    	}
    }

    /**
     * Function to be executed when field is slaved.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     *
     * @since 2015.2
     */
    function postSourcing(scriptContext) {

    }

    /**
     * Function to be executed after sublist is inserted, removed, or edited.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @since 2015.2
     */
    function sublistChanged(scriptContext) {

    }

    /**
     * Function to be executed after line is selected.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @since 2015.2
     */
    function lineInit(scriptContext) {

    }

    /**
     * Validation function to be executed when field is changed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
     * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
     *
     * @returns {boolean} Return true if field is valid
     *
     * @since 2015.2
     */
    function validateField(scriptContext) {

    }

    /**
     * Validation function to be executed when sublist line is committed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @returns {boolean} Return true if sublist line is valid
     *
     * @since 2015.2
     */
    function validateLine(scriptContext) {

    }

    /**
     * Validation function to be executed when sublist line is inserted.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @returns {boolean} Return true if sublist line is valid
     *
     * @since 2015.2
     */
    function validateInsert(scriptContext) {

    }

    /**
     * Validation function to be executed when record is deleted.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @returns {boolean} Return true if sublist line is valid
     *
     * @since 2015.2
     */
    function validateDelete(scriptContext) {

    }

    
    function saveRecord(scriptContext) {

    	
    	// Do action here
    	var record = scriptContext.currentRecord;
    	var isSelected = "F"
    	
    	var count =  record.getLineCount({
	    		sublistId : "custpage_billpayments"
	    	});
        console.log('count', count);

        var selected = 0;
        var selectedTrans = [];
		
        if (count > 0) {       
	        for (var i=0; i <=count ; i++) {
	        	var isSelected = record.getCurrentSublistValue("custpage_billpayments", "select");
                console.log('isSelected', isSelected);

	        	if (isSelected == 'T' || isSelected == true) {
	                console.log('isSelected T', i);
	                break;       		
	        	}
	        	
	        }
	        
	        if (isSelected == "F" || isSelected == false){
	        	alert("Please select transaction to update.");
	        	return false;
	        }
	        
	        
        }
        
        
        return true;

    

    }

    

    // Other functions
    function getSuiteletPage(suiteletScriptId, suiteletDeploymentId, pageId) {
        document.location = url.resolveScript({
                scriptId : suiteletScriptId,
                deploymentId : suiteletDeploymentId,
                params : {
                    'page' : pageId
                }
            });
    }

    function getParameterFromURL(param) {
        var query = window.location.search.substring(1);
        var vars = query.split("&");
        for (var i = 0; i < vars.length; i++) {
            var pair = vars[i].split("=");
            if (pair[0] == param) {
                return decodeURIComponent(pair[1]);
            }
        }
        return (false);
    }
    
    
    
    
    
    
    
    
    
    
    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged,
        //postSourcing: postSourcing,
        //sublistChanged: sublistChanged,
        //lineInit: lineInit,
        //validateField: validateField,
        //validateLine: validateLine,
        //validateInsert: validateInsert,
        //validateDelete: validateDelete,
        saveRecord: saveRecord
    };
    
});
