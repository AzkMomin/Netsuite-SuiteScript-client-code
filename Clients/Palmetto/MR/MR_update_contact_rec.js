/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */

define([
    'N/search', 'N/record',
], function (search, record) {

    const getInputData = () => {
        //saved search which lists out the invoices where delta dollars are used
        const contactSearchColInternalId = search.createColumn({ name: 'internalid' });
        const contactSearchColName = search.createColumn({ name: 'entityid', sort: search.Sort.ASC });
        const contactSearchColVendor = search.createColumn({ name: 'company' });
        const contactSearchColCompanyInternalid = search.createColumn({ name: 'internalid', join: 'company' });
        const contactSearchColRole = search.createColumn({ name: 'contactrole' });
        const contactSearchColFormulaTextXP96HPCN = search.createColumn({ name: 'formulatext', formula: '{role}' });
        const contactSearch = search.create({
            type: 'contact',
            filters: [
                ['company.type', 'anyof', 'Vendor'],
                'AND',
                ['role', 'noneof', '-10'],
                'AND',
                ['internalid', 'anyof', '977805'],
            ],
            columns: [
                contactSearchColInternalId,
                contactSearchColName,
                contactSearchColVendor,
                contactSearchColCompanyInternalid,
                contactSearchColRole,
                contactSearchColFormulaTextXP96HPCN,
            ],
        });
        return contactSearch;
    }

    const map = (context) => {
        var contactRecResult = JSON.parse(context.value);
        log.debug('searchResult : ', contactRecResult);
        // log.debug('searchResult id: ', contactRecResult.id)

        var contactRec = record.submitFields({
            type: "contact",
            id: contactRecResult.id,
            values: {
                'contactrole': -10
            }
        });

        log.debug("contactRec save Id : ", contactRec)


    }

    return {
        getInputData,
        map
    }

});