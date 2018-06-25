const ERROR = "ERROR";
const OK = "OK";

var ajax_using_query = function ( _url, _sendData , _callback, _isAsync ){
    var return_value = null;
    $.ajax({
        type : 'post',
        url : _url,
        data : _sendData,
        dataType : 'json',
        async : false,
        error: function(xhr, status, error){
            alert(error);
        },
        success : function(json){
            return_value = json;
            _callback(json);
        },
    });

    return return_value;
}

function get_form_data_to_json($form){
    var unindexed_array = $form.serializeArray();
    var indexed_array = {};

    $.map(unindexed_array, function(n, i){
        indexed_array[n['name']] = n['value'];
    });

    return indexed_array;
}

// JavaScript Code
$.urlParam = function(name) {
    var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
    if (results == null) {
        return null;
    }
    else {
        return results[1] || 0;
    }

}

const seat_info = { 0: `  
                <div class="seat_row">
                    <div id="A1" class="seat  ">A1</div>
                    <div id="A2" class="seat  aisle-right">A2</div>
                    <div id="A3" class="seat  ">A3</div>
                    <div id="A4" class="seat  ">A4</div>
                    <div id="A5" class="seat  ">A5</div>
                    <div id="A6" class="seat  ">A6</div> 
                    <div id="A7" class="seat  ">A7</div>
                    <div id="A8" class="seat  aisle-left">A8</div>
                    <div id="A9" class="seat  ">A9</div>
                </div> 
                <div class="seat_row">
                    <div id="B1" class="seat  ">B1</div>
                    <div id="B2" class="seat  aisle-right">B2</div>
                    <div id="B3" class="seat  ">B3</div>
                    <div id="B4" class="seat  ">B4</div>
                    <div id="B5" class="seat  ">B5</div>
                    <div id="B6" class="seat  ">B6</div>
                    <div id="B7" class="seat  ">B7</div>
                    <div id="B8" class="seat  aisle-left">B8</div>
                    <div id="B9" class="seat  ">B9</div>
                </div> 
                <div class="seat_row">
                    <div id="C1" class="seat  ">C1</div>
                    <div id="C2" class="seat  aisle-right">C2</div>
                    <div id="C3" class="seat  ">C3</div>
                    <div id="C4" class="seat  ">C4</div>
                    <div id="C5" class="seat  ">C5</div>
                    <div id="C6" class="seat  ">C6</div>
                    <div id="C7" class="seat  ">C7</div>
                    <div id="C8" class="seat  aisle-left">C8</div>
                    <div id="C9" class="seat  ">C9</div>
                </div> 
                <div class="seat_row">
                    <div id="D1" class="seat">D1</div>
                    <div id="D2" class="seat  aisle-right">D2</div>
                    <div id="D3" class="seat">D3</div>
                    <div id="D4" class="seat  ">D4</div>
                    <div id="D5" class="seat  ">D5</div>
                    <div id="D6" class="seat  ">D6</div>
                    <div id="D7" class="seat  ">D7</div>
                    <div id="D8" class="seat  aisle-left">D8</div>
                    <div id="D9" class="seat  ">D9</div>
                </div> 
                <div class="seat_row">
                    <div id="E1" class="seat  ">E1</div>
                    <div id="E2" class="seat  aisle-right">E2</div>
                    <div id="E3" class="seat">E3</div>
                    <div id="E4" class="seat">E4</div>
                    <div id="E5" class="seat  ">E5</div>
                    <div id="E6" class="seat  ">E6</div>
                    <div id="E7" class="seat  ">E7</div>
                    <div id="E8" class="seat  aisle-left">E8</div>
                    <div id="E9" class="seat  ">E9</div>
                </div> 
                <div class="seat_row">
                    <div id="F1" class="seat  ">F1</div>
                    <div id="F2" class="seat  aisle-right">F2</div>
                    <div id="F3" class="seat  ">F3</div>
                    <div id="F4" class="seat  ">F4</div>
                    <div id="F5" class="seat  ">F5</div>
                    <div id="F6" class="seat  ">F6</div>
                    <div id="F7" class="seat  ">F7</div>
                    <div id="F8" class="seat  aisle-left">F8</div>
                    <div id="F9" class="seat  ">F9</div>
                </div> 
                <div class="seat_row">
                    <div id="G1" class="seat  ">G1</div>
                    <div id="G2" class="seat  aisle-right">G2</div>
                    <div id="G3" class="seat  ">G3</div>
                    <div id="G4" class="seat  ">G4</div>
                    <div id="G5" class="seat  ">G5</div>
                    <div id="G6" class="seat  ">G6</div>
                    <div id="G7" class="seat  ">G7</div>
                    <div id="G8" class="seat  aisle-left">G8</div>
                    <div id="G9" class="seat  ">G9</div>
                </div> 
                <div class="seat_row">
                    <div id="H1" class="seat  ">H1</div>
                    <div id="H2" class="seat  aisle-right">H2</div>
                    <div id="H3" class="seat  ">H3</div>
                    <div id="H4" class="seat  ">H4</div>
                    <div id="H5" class="seat  ">H5</div>
                    <div id="H6" class="seat  ">H6</div>
                    <div id="H7" class="seat  ">H7</div>
                    <div id="H8" class="seat  aisle-left">H8</div>
                    <div id="H9" class="seat  ">H9</div>
                </div> 
                <div class="seat_row">
                    <div id="I1" class="seat  aisle-top">I1</div>
                    <div id="I2" class="seat  aisle-top">I2</div>
                    <div id="I3" class="seat  aisle-top">I3</div>
                    <div id="I4" class="seat  aisle-top">I4</div>
                    <div id="I5" class="seat  aisle-top">I5</div>
                    <div id="I6" class="seat  aisle-top">I6</div>
                </div>  
              `,

    1: `        
                <div class="seat_row">
                    <div id="A1" class="seat  ">A1</div>
                    <div id="A2" class="seat  aisle-right">A2</div>
                    <div id="A3" class="seat  ">A3</div>
                    <div id="A4" class="seat  ">A4</div>
                    <div id="A5" class="seat  ">A5</div>
                    <div id="A6" class="seat  ">A6</div> 
                    <div id="A7" class="seat  ">A7</div>
                    <div id="A8" class="seat  aisle-left">A8</div>
                    <div id="A9" class="seat  ">A9</div>
                </div> 
                <div class="seat_row">
                    <div id="B1" class="seat  ">B1</div>
                    <div id="B2" class="seat  aisle-right">B2</div>
                    <div id="B3" class="seat  ">B3</div>
                    <div id="B4" class="seat  ">B4</div>
                    <div id="B5" class="seat  ">B5</div>
                    <div id="B6" class="seat  ">B6</div>
                    <div id="B7" class="seat  ">B7</div>
                    <div id="B8" class="seat  aisle-left">B8</div>
                    <div id="B9" class="seat  ">B9</div>
                </div> 
                <div class="seat_row">
                    <div id="C1" class="seat  ">C1</div>
                    <div id="C2" class="seat  aisle-right">C2</div>
                    <div id="C3" class="seat  ">C3</div>
                    <div id="C4" class="seat  ">C4</div>
                    <div id="C5" class="seat  ">C5</div>
                    <div id="C6" class="seat  ">C6</div>
                    <div id="C7" class="seat  ">C7</div>
                    <div id="C8" class="seat  aisle-left">C8</div>
                    <div id="C9" class="seat  ">C9</div>
                </div> 
                <div class="seat_row">
                    <div id="D1" class="seat">D1</div>
                    <div id="D2" class="seat  aisle-right">D2</div>
                    <div id="D3" class="seat">D3</div>
                    <div id="D4" class="seat  ">D4</div>
                    <div id="D5" class="seat  ">D5</div>
                    <div id="D6" class="seat  ">D6</div>
                    <div id="D7" class="seat  ">D7</div>
                    <div id="D8" class="seat  aisle-left">D8</div>
                    <div id="D9" class="seat  ">D9</div>
                </div> 
                <div class="seat_row">
                    <div id="E1" class="seat  ">E1</div>
                    <div id="E2" class="seat  aisle-right">E2</div>
                    <div id="E3" class="seat">E3</div>
                    <div id="E4" class="seat">E4</div>
                    <div id="E5" class="seat  ">E5</div>
                    <div id="E6" class="seat  ">E6</div>
                    <div id="E7" class="seat  ">E7</div>
                    <div id="E8" class="seat  aisle-left">E8</div>
                    <div id="E9" class="seat  ">E9</div>
                </div> 
                `,
    2: `  
                <div class="seat_row">
                    <div id="A1" class="seat  ">A1</div>
                    <div id="A2" class="seat  aisle-right">A2</div>
                    <div id="A3" class="seat  ">A3</div>
                    <div id="A4" class="seat  ">A4</div>
                    <div id="A5" class="seat  ">A5</div>
                    <div id="A6" class="seat  ">A6</div> 
                    <div id="A7" class="seat  ">A7</div>
                    <div id="A8" class="seat  aisle-left">A8</div>
                    <div id="A9" class="seat  ">A9</div>
                </div> 
                <div class="seat_row">
                    <div id="B1" class="seat  ">B1</div>
                    <div id="B2" class="seat  aisle-right">B2</div>
                    <div id="B3" class="seat  ">B3</div>
                    <div id="B4" class="seat  ">B4</div>
                    <div id="B5" class="seat  ">B5</div>
                    <div id="B6" class="seat  ">B6</div>
                    <div id="B7" class="seat  ">B7</div>
                    <div id="B8" class="seat  aisle-left">B8</div>
                    <div id="B9" class="seat  ">B9</div>
                </div> 
                <div class="seat_row">
                    <div id="C1" class="seat  ">C1</div>
                    <div id="C2" class="seat  aisle-right">C2</div>
                    <div id="C3" class="seat  ">C3</div>
                    <div id="C4" class="seat  ">C4</div>
                    <div id="C5" class="seat  ">C5</div>
                    <div id="C6" class="seat  ">C6</div>
                    <div id="C7" class="seat  ">C7</div>
                    <div id="C8" class="seat  aisle-left">C8</div>
                    <div id="C9" class="seat  ">C9</div>
                </div> 
                <div class="seat_row">
                    <div id="D1" class="seat">D1</div>
                    <div id="D2" class="seat  aisle-right">D2</div>
                    <div id="D3" class="seat">D3</div>
                    <div id="D4" class="seat  ">D4</div>
                    <div id="D5" class="seat  ">D5</div>
                    <div id="D6" class="seat  ">D6</div>
                    <div id="D7" class="seat  ">D7</div>
                    <div id="D8" class="seat  aisle-left">D8</div>
                    <div id="D9" class="seat  ">D9</div>
                </div> 
                <div class="seat_row">
                    <div id="E1" class="seat  ">E1</div>
                    <div id="E2" class="seat  aisle-right">E2</div>
                    <div id="E3" class="seat">E3</div>
                    <div id="E4" class="seat">E4</div>
                    <div id="E5" class="seat  ">E5</div>
                    <div id="E6" class="seat  ">E6</div>
                    <div id="E7" class="seat  ">E7</div>
                    <div id="E8" class="seat  aisle-left">E8</div>
                    <div id="E9" class="seat  ">E9</div>
                </div> 
                <div class="seat_row">
                    <div id="F1" class="seat  ">F1</div>
                    <div id="F2" class="seat  aisle-right">F2</div>
                    <div id="F3" class="seat  ">F3</div>
                    <div id="F4" class="seat  ">F4</div>
                    <div id="F5" class="seat  ">F5</div>
                    <div id="F6" class="seat  ">F6</div>
                    <div id="F7" class="seat  ">F7</div>
                    <div id="F8" class="seat  aisle-left">F8</div>
                    <div id="F9" class="seat  ">F9</div>
                </div> 
                <div class="seat_row">
                    <div id="G1" class="seat  ">G1</div>
                    <div id="G2" class="seat  aisle-right">G2</div>
                    <div id="G3" class="seat  ">G3</div>
                    <div id="G4" class="seat  ">G4</div>
                    <div id="G5" class="seat  ">G5</div>
                    <div id="G6" class="seat  ">G6</div>
                    <div id="G7" class="seat  ">G7</div>
                    <div id="G8" class="seat  aisle-left">G8</div>
                    <div id="G9" class="seat  ">G9</div>
                </div> 
                <div class="seat_row">
                    <div id="H1" class="seat  ">H1</div>
                    <div id="H2" class="seat  aisle-right">H2</div>
                    <div id="H3" class="seat  ">H3</div>
                    <div id="H4" class="seat  ">H4</div>
                    <div id="H5" class="seat  ">H5</div>
                    <div id="H6" class="seat  ">H6</div>
                    <div id="H7" class="seat  ">H7</div>
                    <div id="H8" class="seat  aisle-left">H8</div>
                    <div id="H9" class="seat  ">H9</div>
                </div> 
                <div class="seat_row">
                    <div id="I1" class="seat  aisle-top">I1</div>
                    <div id="I2" class="seat  aisle-top">I2</div>
                    <div id="I3" class="seat  aisle-top">I3</div>
                    <div id="I4" class="seat  aisle-top">I4</div>
                    <div id="I5" class="seat  aisle-top">I5</div>
                    <div id="I6" class="seat  aisle-top">I6</div>
                </div>  
              `,

};
