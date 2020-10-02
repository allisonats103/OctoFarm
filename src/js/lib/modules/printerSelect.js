import OctoFarmClient from "../octofarm.js";

const printersTable = `
<div class="row">
    <div class="col-md-3">
                       <div class="input-group mb-3">
                            <div class="input-group-prepend">
                                <label class="input-group-text" for="printerStateList">State: </label>
                            </div>
                            <select class="custom-select" id="printerStateList"
                                    data-jplist-control="select-filter"
                                    data-group="printer-list"
                                    data-name="state"
                            >
                                <option selected
                                         href="#"
                                        data-value="all"
                                        data-path="default"
                                >Filter</option>
                                    <option 
                                            href="#"
                                            value="active"
                                            data-path=".Active">Active</option>
                                    <option 
                                            href="#"
                                            value="idle"
                                            data-path=".Idle">Idle</option>
                                    <option 
                                            href="#"
                                            value="complete"
                                            data-path=".Complete">Complete</option>
                                    <option 
                                             href="#"
                                            value="disconnected"
                                            data-path=".Disconnected">Disconnected</option>
                            </select>
                        </div>
    </div>
    <div class="col-md-3">
                         <div class="input-group mb-3">
                            <div class="input-group-prepend">
                                <label class="input-group-text" for="printerGroupList">Group: </label>
                            </div>
                            <select class="custom-select" id="printerGroupList"
                                    data-jplist-control="select-filter"
                                    data-group="printer-list"
                                    data-name="group"
                            >
                            </select>
                        </div>
    </div>
    <div class="col-md-3">

    </div>
    <div id="selectBtns" class="col-md-3">

    </div>
</div>
<table class="table table-dark">
  <thead>
    <tr>
      <th id="selectColumn" scope="col">Select</th>
      <th scope="col">Index</th>
      <th scope="col">Name</th>
      <th scope="col" id="urlColumn" class="d-none">Printer URL</th>
      <th id="stateColumn" scope="col">State</th>
      <th scope="col">Group</th>
      <th id="spoolColumn" scope="col">Spool</th>
      <th id="cameraColumn" scope="col" class="d-none">Camera URL</th>
      <th id="apiColumn" scope="col" class="d-none">API KEY</th>
    </tr>
  </thead>
  <tbody id="printerSelectBody" data-jplist-group="printer-list">

  </tbody>
</table>
`;

export default class PrinterSelect{
    static getSelectableList(printer){
        return `
                       <tr id="${printer.id}" class="${printer.state}" data-jplist-item>
                          <td>
                                <div class="custom-control custom-checkbox">
                                  <input type="checkbox" class="custom-control-input Idle" id="checkBox-${printer.id}" value="${printer.id}">
                                  <label class="custom-control-label" for="checkBox-${printer.id}"></label>
                                </div>
                          </td>
                          <th scope="row">${printer.index}</th>
                          <td>${printer.name}</td>
                          <td class="${printer.state}">${printer.state}</td>
                          <td class="${printer.group.replace(/\s/g, '_')}">${printer.group}</td>
                          <td>${printer.spool}</td>
                        </tr>
                `;
    }
    static getEditableList(printer){
        return `
                       <tr id="${printer.id}" class="${printer.state}" data-jplist-item>
                          <th scope="row">${printer.index}</th>
                          <td><input type="text" class="form-control Idle" placeholder="${printer.name}" aria-label="Username" aria-describedby="basic-addon1"></td>
                          <td><input type="text" class="form-control Idle" placeholder="${printer.printerURL}" aria-label="Username" aria-describedby="basic-addon1"></td>
                          <td class="${printer.state} d-none">${printer.state}</td>
                          <td class="${printer.group.replace(/\s/g, '_')}"><input type="text" class="form-control Idle" placeholder="${printer.group}" aria-label="Username" aria-describedby="basic-addon1"></td>
                          <td><input type="text" class="form-control Idle" placeholder="${printer.cameraURL}" aria-label="Username" aria-describedby="basic-addon1"></td>
                          <td><input type="text" class="form-control Idle" placeholder="${printer.apikey}" aria-label="Username" aria-describedby="basic-addon1"></td>
                        </tr>
                `;
    }
    static isOffline(state, editable, override){
        if(editable){
            return true;
        }else if(override){
            return true;
        }else{
            return state !== 'Offline';
        }
    }
    static async create(element, editable, action, callback){
        if(action){
            document.getElementById("printerEditLabel").innerHTML = action;
        }
        let override = false;
        console.log(action);
        if(action === "Printer Deletion"){
            override = true;
        }

        element.innerHTML = "";
        const printersInfo = await OctoFarmClient.post("printers/printerInfo");
        const printers = await printersInfo.json();
        const groupList = [];
        const printerList = [];

        printers.forEach(printer => {
            if(typeof printer.printerState !== 'undefined' && this.isOffline(printer.printerState.colour.category, editable, override)){
                let spoolName = "";
                if(printer.selectedFilament.length !== 0){
                    printer.selectedFilament.forEach((spool, index) => {
                        if(spool !== null) {
                            spoolName += `Tool ${index}: ${spool.spools.name} - ${spool.spools.material} <br>`;
                        }else{
                            spoolName += `Tool ${index}: No Spool Selected <br>`;
                        }
                    });
                }else{
                    spoolName = "No Spool Selected";
                }
                const forList = {
                    id: printer._id,
                    index: printer.sortIndex,
                    name: printer.printerName,
                    printerURL: printer.printerURL,
                    state: printer.printerState.colour.category,
                    group: printer.group,
                    spool: spoolName,
                    cameraURL: printer.cameraURL,
                    apikey: printer.apikey
                };
                printerList.push(forList);
            }
            if(printer.group !== ""){
                const group = {
                    display: printer.group,
                    tag: printer.group.replace(/\s/g, '_')
                };
                groupList.push(group);
            }
        });


        const groupListUnique = _.uniq(groupList, 'tag');
        if(printerList.length !== 0){
            //Create printers table
            element.innerHTML = printersTable;
            const tableBody = document.getElementById("printerSelectBody");
            if(editable){
                document.getElementById("spoolColumn").classList.add("d-none");
                document.getElementById("stateColumn").classList.add("d-none");
                document.getElementById("cameraColumn").classList.remove("d-none");
                document.getElementById("apiColumn").classList.remove("d-none");
                document.getElementById("selectColumn").classList.add("d-none");
                document.getElementById("urlColumn").classList.remove("d-none");

                printerList.forEach(printer => {
                    tableBody.insertAdjacentHTML('beforeend', this.getEditableList(printer));
                });
            }else{
                printerList.forEach(printer => {
                    tableBody.insertAdjacentHTML('beforeend', this.getSelectableList(printer));
                });
            }

            const printerGroupList = document.getElementById("printerGroupList");
            printerGroupList.innerHTML = "";
            printerGroupList.insertAdjacentHTML('beforeend', `
                                  <option selected
                                        value="all"
                                        data-path="default"
                                >Filter</option>
            `);
            groupListUnique.forEach((group, index) => {
                printerGroupList.insertAdjacentHTML('beforeend', `
                                                        <option
                                                        value="${group.tag.toLowerCase()}"
                                                        data-path=".${group.tag}">${group.display}</option>
                `);
            });
        }else{
            const tableBody = document.getElementById("printerSelectBody");
            tableBody.insertAdjacentHTML('beforeend', `<tr><td>No Online Printers</td></tr>`);
        }
        PrinterSelect.addListeners(editable, callback);
    }
    static addListeners(editable, callback){
        if(!editable){
            document.getElementById("selectBtns").innerHTML = `
                    <button id="selectAll" type="button" class="btn btn-secondary"><i class="fas fa-check-square"></i> Select All</button>
                    <button id="selectNone" type="button" class="btn btn-secondary"><i class="fas fa-square"></i> Deselect All</button>
            `;
            document.getElementById("selectAll").addEventListener('click', e => {
                const checkBoxes = document.querySelectorAll('input[type="checkbox"]:not(:checked)');
                checkBoxes.forEach(box => {
                    box.checked = true;
                });
            });
            document.getElementById("selectNone").addEventListener('click', e => {
                const checkBoxes = document.querySelectorAll('input[type="checkbox"]:checked');
                checkBoxes.forEach(box => {
                    box.checked = false;
                });
            });

        }
        if(callback){
            document.getElementById("saveEditsBtn").addEventListener("click", callback);
        }
        jplist.init();
    }
    static getSelected(){
        const checkedBoxes = document.querySelectorAll('input[type="checkbox"]:checked');
        const printers = [];
        checkedBoxes.forEach(box => {
            if(box.id.includes("checkBox")){
                printers.push(box);
            }}
        );
        return printers;
    }
    static selectFilter(){

    }

}