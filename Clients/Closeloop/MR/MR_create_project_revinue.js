/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */

define([
    'N/search', 'N/record', 'N/format'
], function (search, record, format) {

    const getInputData = () => {
        //saved search which lists out the invoices where delta dollars are used
        const chargeRuleSearch = search.load({
            id: 3487
        })


        return chargeRuleSearch
    }
    const map = (context) => {
        var chargeRuleRec = JSON.parse(context.value);
        // log.debug('searchResult : ', chargeRuleRec)
        // log.debug('searchResult id: ', SoRecResult.id)
        try {
            var projectRevinueRuleRec = record.create({
                type: 'pctcompleteprojectrevenuerule',
                isDynamic: true
            })


            projectRevinueRuleRec.setValue('customform', 340);
            projectRevinueRuleRec.setValue('project', chargeRuleRec.values.company.value);
            // projectRevinueRuleRec.setValue('name', chargeRuleRec.values.name);
            projectRevinueRuleRec.setValue('name', chargeRuleRec.values.name);

            var projectField = search.lookupFields({
                type: 'job',
                id: chargeRuleRec.values.company.value,
                columns: ['custentity_service_item']
            });

            projectRevinueRuleRec.setValue('serviceitem', projectField.custentity_service_item[0].value);
            projectRevinueRuleRec.selectNewLine('chargerule')
            projectRevinueRuleRec.setCurrentSublistValue('chargerule', 'chargerule', chargeRuleRec.id);
            projectRevinueRuleRec.setCurrentSublistValue('chargerule', 'ruletype', 'TIMEBASED');
            projectRevinueRuleRec.commitLine('chargerule')

            var projectRevinueRuleRecSaveId = projectRevinueRuleRec.save()
            log.debug('Project Revinue Rule Rec Save ID :', projectRevinueRuleRecSaveId)

            
            // var timeBasedChargeruleRec = record.submitFields({
            //     type: 'chargerule',
            //     id: chargeRuleRec.id,
            //     values: {
            //         'custrecord_prj_revenue_rule_created': true
            //     }
            // });
            var timeBasedChargeruleRec = record.load({
                type: 'chargerule',
                id: chargeRuleRec.id,
                
            });
            timeBasedChargeruleRec.setValue('custrecord_prj_revenue_rule_created', true);
            var timeBasedChargeruleRecId = timeBasedChargeruleRec.save()
            log.debug('Time Base charge Rule Rec Save ID :', timeBasedChargeruleRecId)
        }
        catch (e) {
            log.debug("error : ", e)
        }

    }

    return {
        getInputData,
        map
    }

});