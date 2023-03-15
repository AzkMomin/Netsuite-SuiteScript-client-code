/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/log', 'N/search'], function (record, log, search) {

  function addLinesPartnerAdders(context) {

    var newRec = context.newRecord;
    log.debug('newRec is', newRec);

    var createdFrom = newRec.getValue({
      fieldId: 'createdfrom'
    })

    var SOFields = search.lookupFields({
      type: search.Type.SALES_ORDER,
      id: createdFrom,
      columns: ['custbody_pal_build_partner', 'custbody_sf_num_sol_pan']
    });
    log.debug("SOFields : ", SOFields);

    var vendorFields = search.lookupFields({
      type: "vendor",
      id: SOFields.custbody_pal_build_partner[0].value,
      columns: ['custentity_per_panel_bp_rate', 'custentity_min_sys_size_vendor']
    });

    log.debug("vendorFields : ", vendorFields);
    var perPannelRate = parseInt(vendorFields.custentity_per_panel_bp_rate)

    if ((!isEmpty(createdFrom)) && (context.type == context.UserEventType.EDIT)) {

      var oldRec = context.oldRecord;

      var newRec = context.newRecord;

      var poVendorOld = oldRec.getValue({
        fieldId: 'entity'
      })
      log.debug('poVendorOld is', poVendorOld);

      var poVendorNew = newRec.getValue({
        fieldId: 'entity'
      })
      log.debug('poVendorNew is', poVendorNew);

      if (poVendorOld !== poVendorNew) {

        log.debug('Vendor Mismatch');

        var bpSteepRoofLine = newRec.findSublistLineWithValue({
          sublistId: 'item',
          fieldId: 'item',
          value: 3763 //change Prod ID
        });


        if (!isEmpty(bpSteepRoofLine)) {

          newRec.removeLine({
            sublistId: 'item',
            line: bpSteepRoofLine
          });

        }

        var bpSmallSysLine = newRec.findSublistLineWithValue({
          sublistId: 'item',
          fieldId: 'item',
          value: 3943 //change Prod ID
        });


        if (!isEmpty(bpSmallSysLine)) {

          newRec.removeLine({
            sublistId: 'item',
            line: bpSmallSysLine
          });
        }


        var soRoofPitchInfo = search.lookupFields({

          type: search.Type.SALES_ORDER,
          id: createdFrom,
          columns: ['custbody_roof_pitch', 'custbody_sf_num_sol_pan']
        });
        var soRoofPitch = soRoofPitchInfo['custbody_roof_pitch']

        var soPanels = soRoofPitchInfo['custbody_sf_num_sol_pan']

        var vendorSteepPitchInfo = search.lookupFields({

          type: search.Type.VENDOR,
          id: poVendorNew,
          columns: ['custentity_roof_pitch', 'custentity_min_sys_size_vendor']
        });
        var vendorSteepPitch = vendorSteepPitchInfo['custentity_roof_pitch']

        var vendorSysSize = vendorSteepPitchInfo['custentity_min_sys_size_vendor']


        var poItemCount = newRec.getLineCount({
          sublistId: 'item'
        });

        var newLinenum = poItemCount;

        if ((soRoofPitch > vendorSteepPitch) && (soPanels < vendorSysSize) && (!isEmpty(vendorSysSize))) {



          var perPanelLineRate;

          var perPanelLine = newRec.findSublistLineWithValue({
            sublistId: 'item',
            fieldId: 'description',
            value: 'BP Services Per Panel'
          });
          log.debug('perPanelLine Loop1 EDIT is', perPanelLine);

          perPanelLineRate = newRec.getSublistValue({
            sublistId: 'item',
            fieldId: 'rate',
            line: perPanelLine
          });
          
          newRec.insertLine({
            sublistId: 'item',
            line: newLinenum
          });

          newRec.setSublistValue({
            sublistId: 'item',
            fieldId: 'item',
            line: newLinenum,
            value: 3823 //change Prod ID
          });

          newRec.setSublistValue({
            sublistId: 'item',
            fieldId: 'quantity',
            line: newLinenum,
            value: soPanels
          });

          newRec.insertLine({
            sublistId: 'item',
            line: newLinenum + 1
          });

          newRec.setSublistValue({
            sublistId: 'item',
            fieldId: 'item',
            line: newLinenum + 1,
            value: 3943 //change Prod ID
          });

          var bpQty = vendorSysSize - soPanels;

          newRec.setSublistValue({
            sublistId: 'item',
            fieldId: 'quantity',
            line: newLinenum + 1,
            value: bpQty
          });
          //Check If vendor has its per panel rate if contains then set that value if not then take from PO line
          if (perPannelRate != 0 && perPannelRate != "") {
            perPanelLineRate = perPannelRate
          }
          log.debug('perPanelLine Loop3 EDIT is', perPanelLine);
          newRec.setSublistValue({
            sublistId: 'item',
            fieldId: 'rate',
            line: newLinenum + 1,
            value: perPanelLineRate
          });
        }

        else if ((soRoofPitch > vendorSteepPitch) && (!isEmpty(vendorSysSize))) {

          newRec.insertLine({
            sublistId: 'item',
            line: newLinenum
          });

          newRec.setSublistValue({
            sublistId: 'item',
            fieldId: 'item',
            line: newLinenum,
            value: 3823 //change Prod ID
          });

          newRec.setSublistValue({
            sublistId: 'item',
            fieldId: 'quantity',
            line: newLinenum,
            value: soPanels
          });

        }
        else if ((soPanels < vendorSysSize) && (!isEmpty(vendorSysSize))) {

          var perPanelLineRate;

          var perPanelLine = newRec.findSublistLineWithValue({
            sublistId: 'item',
            fieldId: 'description',
            value: 'BP Services Per Panel'
          });
          

          perPanelLineRate = newRec.getSublistValue({
            sublistId: 'item',
            fieldId: 'rate',
            line: perPanelLine
          });
          log.debug('perPanelLineRate Loop3 EDIT is', perPanelLineRate);

          newRec.insertLine({
            sublistId: 'item',
            line: newLinenum
          });

          newRec.setSublistValue({
            sublistId: 'item',
            fieldId: 'item',
            line: newLinenum,
            value: 3943 //change Prod ID
          });

          var bpQty = vendorSysSize - soPanels;

          newRec.setSublistValue({
            sublistId: 'item',
            fieldId: 'quantity',
            line: newLinenum,
            value: bpQty
          });

          //Check If vendor has its per panel rate if contains then set that value if not then take from PO line
          if (perPannelRate != 0 && perPannelRate != "") {
            perPanelLineRate = perPannelRate
          }
          log.debug('perPanelLine Loop3 EDIT is', perPanelLine);
          newRec.setSublistValue({
            sublistId: 'item',
            fieldId: 'rate',
            line: newLinenum,
            value: perPanelLineRate
          });
        }
      }

    }





  }

  return {
    beforeSubmit: addLinesPartnerAdders
  }
});
function isEmpty(value) {
  if (value == null || value == 'null' || value == undefined || value == 'undefined' || value == '' || value == "" || value.length <= 0) {
    return true;
  }
  return false;
}       