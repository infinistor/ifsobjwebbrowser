/*
* Copyright (c) 2021 PSPACE, inc. KSAN Development Team ksan@pspace.co.kr
* KSAN is a suite of free software: you can redistribute it and/or modify it under the terms of
* the GNU General Public License as published by the Free Software Foundation, either version 
* 3 of the License.  See LICENSE for details
*
* 본 프로그램 및 관련 소스코드, 문서 등 모든 자료는 있는 그대로 제공이 됩니다.
* KSAN 프로젝트의 개발자 및 개발사는 이 프로그램을 사용한 결과에 따른 어떠한 책임도 지지 않습니다.
* KSAN 개발팀은 사전 공지, 허락, 동의 없이 KSAN 개발에 관련된 모든 결과물에 대한 LICENSE 방식을 변경 할 권리가 있습니다.
*/
import { Pipe, PipeTransform } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";

@Pipe({
	name: 'dynamicPipe',
	pure: false
})
export class DynamicPipe implements PipeTransform {

	public translate: TranslateService;

	/**
	 * 색상 프로퍼티명
	 */
	public static COLOR_PROPERTY_NAME: string = "Colors";


	/**
	 * 생성자
	 * @param translate
	 */
	constructor(
		translate: TranslateService,
		// public sanitized: DomSanitizer
	) {
		this.translate = translate;
	}

	/**
	 * transform 구현체
	 * @param item
	 * @param modifier
	 * @param param
	 */
	transform(item: any, modifier: string, param: any): any;
	transform(item: any, modifier: string, param: any, field?: string, useHighlight?: boolean): any
	{
		// 값이 없을 경우
		if (item == null)
			return "";

		if(typeof useHighlight === 'undefined') {
			useHighlight = true;
		}

		const isHighlight = field && item[DynamicPipe.COLOR_PROPERTY_NAME] && useHighlight ? true : false;

		const value: any = field ? this.getValue(item, field) : item;

		let result: any;

		// 값이 정확하지 않으면 빈값으로 리턴
		if ((value == null || value === "" || value == "-" || (value == "-" && param == "-")) && modifier != "getHaStatus")
			return "";

		// enum 값과 modifier가 모두 있는 경우
		if (modifier && param) {
			result = eval('this.' + modifier + '(value ,param)');
		}
		// modifier만 있는 경우
		else if (modifier) {
			result = eval('this.' + modifier + '(value)');
		}
		// 모두 없는 경우
		else {
			result = value;
		}

		// 하이라이트 설정인 경우
		if (isHighlight)
			result = this.setHighlight(item[DynamicPipe.COLOR_PROPERTY_NAME], field, result);

		return result;
	};

	/**
	 * 아이템에서 해당 컬럼의 값을 추출
	 * @param item
	 * @param field
	 */
	public getValue(item: any, field: string): any {
		const fields: string[] = field.split('.');
		let value: any = item[fields[0]];

		for (let i = 1; i < fields.length; i++) {
			value = value[fields[i]];
		}

		return value;
	}

	/**
	 * html 형식을 반환한다
	 * @param value
	 */
	// public trustHtml(value:string): SafeHtml {
	//     return this.sanitized.bypassSecurityTrustHtml(value);
	// }

	/**
	 * 사용자 템플릿을 html형식으로 반환한다
	 * @param value
	 * @param template
	 */
	public customTemplate(value: string, template: string): string {
		//return this.trustHtml(template.replace('{0}', value));
		return template.replace('{0}', value);
	}

	/**
	 * 두가지 필드가 있을때 받아온 프러퍼티 값으로 머징 시킨다
	 * @param value
	 * @param targetPropertiesString
	 */
	public mergeObject(value: any, targetPropertiesString: string): string {
		// , 값으로 프로퍼티를 분리
		let targetProperties = targetPropertiesString.split(',');
		let result = "";

		// 넘어온값이 배열인경우
		if (value instanceof Array) {
			value.forEach((item: any, index: number) => {
				// 받아온 오브젝트를 합친다
				for (let property of targetProperties) {
					// 배열이라면
					if (item[property] instanceof Array) {
						result = result + item[property].join("<br>");
					}
					// 오브젝트라면
					else {

						if (typeof item[property] === "undefined")
							continue;

						if (item[property] != '') {
							if (item[property].split(',').length > 1) {
								result = result + item[property].split(',').join("<br>") + "<br>";
							} else {
								result = result + item[property] + "<br>";
							}
						}
					}
				}

				if (result.indexOf("undefined") > -1)
					result = "";
			});

		} else {

			// 받아온 오브젝트를 합친다
			for (let property of targetProperties) {
				// 배열이라면
				if (value[property] instanceof Array) {
					result = result + value[property].join("<br>");
				}
				// 오브젝트라면
				else {

					if (typeof (value[property]) !== "undefined" )
						result = result + value[property].split(',').join("<br>");
				}
			}

			if (result.indexOf("undefined") > -1)
				result = "";
		}

		return result;
	};


	/**
	 * 하이라이트를 설정한다
	 * @param item
	 * @param field
	 * @param value
	 */
	public setHighlight(item: any, field: string, value: string): string {
		const COLOR_PROPERTY_NAME: string = "Color";
		let result: string = "";
		let hasValue: boolean = false;

		try {

			// color가 설정된 필드가 있는지 확인
			Object.keys(item).forEach((value, index) => {
				if ((typeof (item[value]) !== "object" && item[value] !== null && item[value] !== undefined && item[value] !== "" && value !== COLOR_PROPERTY_NAME) || (typeof (item[value]) === "object" && item[value].length > 0))
					hasValue = true;
			});

			// 현재 필드에 값이 있을 경우
			if (hasValue && item[field] !== null && item[field] !== undefined && item[field] !== "") {
				// 필드 값이 배열인 경우
				if (typeof (item[field]) === "object" && item[field].length >= 0) {
					// 현재 값을 split 한다
					let values: string[] = value.split(',');

					// 배열 값에 해당하는 부분을 찾아서 해당 부분만 색을 넣는다
					item[field].forEach((color: any) => {
						const index = values.findIndex(i => i.trim() === color.Name)
						if (index >= 0)
							values[index] = '<span style="color:' + color.Value + '">' + color.Name + '</span>';
					});

					result = values.join(',');
				}
				// 일반 값일 경우
				else
					result = '<span style="color:' + item[field] + '">' + value + '</span>';
			}
			// 모든 값에 color가 설정되어 있지 않고, color 필드에 값이 있을 경우
			else if (!hasValue && item[COLOR_PROPERTY_NAME] !== "")
				result = '<span style="color:' + item[COLOR_PROPERTY_NAME] + '">' + value + '</span>';
			else
				result = value;
		}
		catch (e) { }

		//return this.trustHtml(result);
		return result;
	}

	/**
	 * 날짜를 포메팅 한다
	 * @param value
	 */
	formatDate(value: any): string {
		if (!value)
			return "";

		return value.toLongDateString();
	};

	/**
	 * 날짜 포메팅(yyyy-MM-dd)
	 * @param value
	 */
	formatShortDate(value: any): string {
		if (!value)
			return "";

		return value.toShortDateString();
	}


	/**
	 * 문자를 그리드안에서 개행시킨다
	 * @param value
	 */
	toMultiLine(value: string): string {
		if (value.isEmpty())
			return "";

		return value.toMultiLine();
	};

	/**
	 * 문자를 그리드안에서 개행시킨다
	 * @param value
	 */
	toMultiLineFromCR(value: string): string {
		if (value.isEmpty())
			return "";

		return value.toMultiLineFromCR();
	};

	/**
	 * 문자를 그리드안에서 개행시킨다
	 * @param value
	 */
	toMultiLineArray(value: Array<any>): string {
		let result:string = "";

		if (value.isEmpty())
			return "";

		for (var i = 0; i < value.length; i++) {
			result += value[i];
			if (i !== (value.length - 1))
				result += "<br>";
		}

		return result;
	};

	/**
	 * object[targetPropertieName] => 1</br>2</br>
	 * @param value
	 * @param targetPropertieName
	 */
	toMultiLineWithValue(value: Array<any>, targetPropertieName: string): string{
		let result: string = "";

		if (typeof value === 'undefined')
			return "";
		if (value.length == 0)
			return "";

		for (var i = 0; i < value.length; i++) {
			result += value[i][targetPropertieName];
			if (i != (value.length - 1))
				result += "<br>";
		}

		return result;
	}

	/**
	 * ex) format = {DeviceName}-{VirtualDeviceName}
	 * @param value
	 * @param format
	 */
	//toMultiLineWithValueFormat(value: Array<any>, format: string): string {
	//    // format추출
	//    const regex = new RegExp('(?<=\{)(.*?)(?=\})', 'g')
	//    const formatNames = format.match(regex);
	//    let result: string = "";
	//    let replace: string = "";

	//    // format에 맞게 변경
	//    for (let i = 0; i < value.length; i++) {
	//        replace = format;
	//        for (let j = 0; j < formatNames.length; j++) {
	//            replace = replace.replace('{' + formatNames[j] + '}', value[i][formatNames[j]]);
	//        }
	//        result += replace;
	//        if (i != (value.length - 1))
	//            result += "<br>";
	//    }
	//    return result;
	//}

	/**
	 * ex) format = {DeviceName}-{VirtualDeviceName}
	 * @param value
	 * @param format
	 */
	toMultiLineDeviceFormat(value: Array<any>, format: string): string {
		// format추출
		//const regex = new RegExp('(?<=\{)(.*?)(?=\})', 'g')
		//const formatNames = format.match(regex);
		let result: string = "";
		//let replace: string = "";

		// format에 맞게 변경
		for (let i = 0; i < value.length; i++) {
			result += (value[i]["DeviceName"] + " (" + value[i]["VirtualDeviceName"] + ")");
			if (i != (value.length - 1))
				result += "<br>";
		}

		return result;

	}

	/**
	 * object[targetPropertieName] => 1,2,3,4,....
	 * @param value
	 * @param targetPropertieName
	 */
	toCommaWithValue(value: Array<any>, targetPropertieName: string): string {
		if (typeof value === 'undefined')
			return "";
		if (value.length == 0)
			return "";

		return value.map(x => x[targetPropertieName]).join(',')
	}



	/**
	 * object["1","2","3"] => 1,2,3,4,....
	 * @param value
	 */
	toCommaWithStringValue(value: Array<any>): string {
		if (typeof value === 'undefined')
			return "";
		if (value.length == 0)
			return "";

		return value.join(',');
	}


	/**
	 * 객체 배열의 Name 값을 ','로 이어 문자열로 만든다.
	 * @param value
	 */
	toCommaWithName(value: Array<any>): string {
		if (typeof value === 'undefined')
			return "";
		if (value.length == 0)
			return "";

		return value.map(i => i.Name).join(',');
	}

	/**
	 * Enum 타입과 맞는 DisplayName 을 출력한다
	 * @param value
	 * @param enumName
	 */
	getEnumTranslate(value: any, enumClass: any): string {
		if (value === 'undefined')
			return "";

		if (value === 99)
			return "";

		if (value === null)
			return "";

		if(enumClass) {
			let translated: string = "";
			if (enumClass.hasOwnProperty('toDisplayShortName')) {
				this.translate.get(enumClass.toDisplayShortName(value)).subscribe(res => {
					translated = res;
				});
			} else {
				translated = enumClass[value];
			}
			return translated;
		}
		else {
			return "";
		}
	};

	clickStyle(value: any): string {
		if (!value)
			return "";

		return `<div class='grid-cell-click'>${value}</div>`;
	}

	clickStyleWithCommaSeperate(value: any): string {
		let result = "";

		if (!value)
			return "";

		let valueArray = value.split(',');
		for (let item of valueArray) {
			result += `<div class='grid-cell-click'>${item}</div>`;
		}

		return result;
	}



	/**
	 * Enum 타입과 맞는 DisplayName 을 출력한다
	 * @param value
	 * @param enumName
	 */
	getEnumTranslateWithClickStyle(value: any, enumClass: any): string {
		if (typeof value === 'undefined')
			return "";

		if (value == 99)
			return "";

		if (value === null)
			return "";

		let translated: string = "";
		if (enumClass.hasOwnProperty('toDisplayShortName')) {
			this.translate.get(enumClass.toDisplayShortName(value)).subscribe(res => {
				translated = res;
			});
		} else {
			translated = enumClass[value];
		}
		return "<div class='grid-cell-click'>" + translated + "</div>";
	};

	/**
	 * Enum 타입과 맞는 DisplayName 을 멀티 라인으로 출력한다
	 * @param value
	 * @param enumClass
	 */
	getEnumTranslateToMultiline(value: any, enumClass: any): string {
		if (typeof value === 'undefined')
			return "";

		let translated = "";
		let translatedWords = "";
		let splited = value.split(',');

		if (value == '')
			return "";

		if (splited.length == 0)
			return "";

		for (var i = 0; i < splited.length; i++) {
			this.translate.get(enumClass.toDisplayShortName(splited[i])).subscribe(res => {
				translated = res;
			});

			translatedWords = (!(i == (splited.length - 1))) ? translatedWords + translated : translatedWords + "," + translated;
		}

		return translatedWords.toMultiLine();
	};

	/**
	 * Enum 타입과 맞는 DisplayName을 콤마로 문자열 연결하여 출력한다
	 * @param value
	 * @param enumClass
	 */
	getEnumTranslateFromArray(value: any, enumClass: any): string {
		if (typeof value === 'undefined')
			return "";

		if (value.length === 0)
			return "";

		let translated: Array<string> = new Array<string>();

		for (var i = 0; i < value.length; i++) {
			this.translate.get(enumClass.toDisplayShortName(value[i])).subscribe(res => {
				translated.push(res);
			});
		}

		return translated.join(',');
	};

	toArrayLength(value: any): string {
		if (!value)
			return '0';

		if (!value.hasOwnProperty('length'))
			return '0';

		return value.length.toString();
	}

	/**
	 * 천단위 콤마
	 * @param num
	 */
	public numberWithCommas(num: number): string {
		const parts: string[] = num.toString().split(".");
		parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
		return parts.join(".");
	}

	/**
	 * 크기 출력
	 * @param num 바이트 수
	 */
	public sizeOnlyAuto(num: number): string {
		let value: number = 0;

		let pbNum = num / 1024 / 1024 / 1024 / 1024 / 1024 / 1024;
		if (pbNum >= 1) {
			value = pbNum;
		} else {
			let pbNum = num / 1024 / 1024 / 1024 / 1024 / 1024;
			if (pbNum >= 1) {
				value = pbNum;
			} else {
				let tbNum = num / 1024 / 1024 / 1024 / 1024;
				if (tbNum >= 1) {
					value = tbNum;
				} else {
					let gbNum = num / 1024 / 1024 / 1024;
					if (gbNum >= 1) {
						value = gbNum;
					} else {
						let mbNum = num / 1024 / 1024;
						if (mbNum >= 1) {
							value = mbNum;
						} else {
							let kbNum = num / 1024;
							value = kbNum;
						}
					}
				}
			}
		}

		const parts: string[] = value.toFixed(1).toString().split(".");
		parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
		return parts.join(".");
	}

	/**
	 * 단위 출력
	 * @param num 바이트 수
	 */
	public unitOnlyAuto(num: number): string {
		let unit: string = '';

		let pbNum = num / 1024 / 1024 / 1024 / 1024 / 1024 / 1024;
		if (pbNum >= 1) {
			unit = 'EB';
		} else {
			let pbNum = num / 1024 / 1024 / 1024 / 1024 / 1024;
			if (pbNum >= 1) {
				unit = 'PB';
			} else {
				let tbNum = num / 1024 / 1024 / 1024 / 1024;
				if (tbNum >= 1) {
					unit = 'TB';
				} else {
					let gbNum = num / 1024 / 1024 / 1024;
					if (gbNum >= 1) {
						unit = 'GB';
					} else {
						let mbNum = num / 1024 / 1024;
						if (mbNum >= 1) {
							unit = 'MB';
						} else {
							unit = 'KB';
						}
					}
				}
			}
		}

		return unit;
	}

	/**
	 * 크기 출력
	 * @param num 바이트 수
	 */
	public sizeBpsOnlyAuto(num: number): string {
		let value: number = 0;

		let pbNum = num / 1024 / 1024 / 1024 / 1024 / 1024;
		if (pbNum >= 1) {
			value = pbNum;
		} else {
			let tbNum = num / 1024 / 1024 / 1024 / 1024;
			if (tbNum >= 1) {
				value = tbNum;
			} else {
				let gbNum = num / 1024 / 1024 / 1024;
				if (gbNum >= 1) {
					value = gbNum;
				} else {
					let mbNum = num / 1024 / 1024;
					if (mbNum >= 1) {
						value = mbNum;
					} else {
						let kbNum = num / 1024;
						value = kbNum;
					}
				}
			}
		}

		const parts: string[] = value.toFixed(1).toString().split(".");
		parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
		return parts.join(".");
	}

	/**

		/**
	 * BPS 단위 출력
	 * @param num 바이트 수
	 */
	public unitBpsOnlyAuto(num: number): string {
		let unit: string = '';

		let pbNum = num / 1024 / 1024 / 1024 / 1024 / 1024;
		if (pbNum >= 1) {
			unit = 'PB/s';
		} else {
			let tbNum = num / 1024 / 1024 / 1024 / 1024;
			if (tbNum >= 1) {
				unit = 'TB/s';
			} else {
				let gbNum = num / 1024 / 1024 / 1024;
				if (gbNum >= 1) {
					unit = 'GB/s';
				} else {
					let mbNum = num / 1024 / 1024;
					if (mbNum >= 1) {
						unit = 'MB/s';
					} else {
						unit = 'KB/s';
					}
				}
			}
		}

		return unit;
	}

	/**
	 * 크기 및 단위까지 출력
	 * @param num 바이트 수
	 */
	public sizeAuto(num: number): string {
		let value: number = 0;
		let unit: string = '';

		let pbNum = num / 1024 / 1024 / 1024 / 1024 / 1024 / 1024;
		if (pbNum >= 1) {
			value = pbNum;
			unit = 'EB';
		}
		else {
			let pbNum = num / 1024 / 1024 / 1024 / 1024 / 1024;
			if (pbNum >= 1) {
				value = pbNum;
				unit = 'PB';
			} else {
				let tbNum = num / 1024 / 1024 / 1024 / 1024;
				if (tbNum >= 1) {
					value = tbNum;
					unit = 'TB';
				} else {
					let gbNum = num / 1024 / 1024 / 1024;
					if (gbNum >= 1) {
						value = gbNum;
						unit = 'GB';
					} else {
						let mbNum = num / 1024 / 1024;
						if (mbNum >= 1) {
							value = mbNum;
							unit = 'MB';
						} else {
							let kbNum = num / 1024;
							value = kbNum;
							unit = 'KB';
						}
					}
				}
			}
		}

		const parts: string[] = value.toFixed(1).toString().split(".");
		parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
		return parts.join(".") + ' ' + unit;
	}

	/**
	 * BPS 크기 및 단위까지 출력
	 * @param num 바이트 수
	 */
	public bpsAuto(num: number): string {
		let value: number = 0;
		let unit: string = '';

		let pbNum = num / 1024 / 1024 / 1024 / 1024 / 1024;
		if (pbNum >= 1) {
			value = pbNum;
			unit = 'PBps';
		} else {
			let tbNum = num / 1024 / 1024 / 1024 / 1024;
			if (tbNum >= 1) {
				value = tbNum;
				unit = 'TBps';
			} else {
				let gbNum = num / 1024 / 1024 / 1024;
				if (gbNum >= 1) {
					value = gbNum;
					unit = 'GBps';
				} else {
					let mbNum = num / 1024 / 1024;
					if (mbNum >= 1) {
						value = mbNum;
						unit = 'MBps';
					} else {
						let kbNum = num / 1024;
						value = kbNum;
						unit = 'KBps';
					}
				}
			}
		}

		const parts: string[] = value.toFixed(1).toString().split(".");
		parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
		return parts.join(".") + ' ' + unit;
	}

	/**
	 * TB 단위 출력
	 * @param num
	 */
	public sizeTB(num: number): string {
		const parts: string[] = (num / 1024 / 1024 / 1024 / 1024).toFixed(1).toString().split(".");
		parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
		return parts.join(".");
	}

	/**
	 * GB 단위 출력
	 * @param num
	 */
	public sizeGB(num: number): string {
		const parts: string[] = (num / 1024 / 1024 / 1024).toFixed(1).toString().split(".");
		parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
		return parts.join(".");
	}

	/**
	 * MB 단위 출력
	 * @param num
	 */
	public sizeMB(num: number): string {
		const parts: string[] = (num / 1024 / 1024).toFixed(1).toString().split(".");
		parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
		return parts.join(".");
	}

	/**
	 * 퍼센트
	 * @param num
	 */
	public percent(num: number): string {
		return num.toFixed(1).toString() + ' %';
	}

	/**
	 * ON/OFF
	 * @param value 값
	 */
	public onOff(value: boolean): string {
		return value ? 'ON' : 'OFF';
	}

	/**
	 * YES/NO
	 * @param value 값
	 */
	public yesNo(value: boolean): string {
		return value ? 'YES' : 'NO';
	}

	/**
	 * VLAN ID 출력
	 * @param vlanId VLAN ID 번호
	 */
	public vlanId(vlanId: number): string {
		if(vlanId <= 1)
			return "-";
		else
			return this.numberWithCommas(vlanId);
	}

	/**
	 * Interface를 여러 행으로 출력
	 * @param values 문자열 배열
	 */
	toInterfaceMultiLine(values: Array<any>): string {
		let result:string = "";

		if (values.isEmpty())
			return "";

		for (var i = 0; i < values.length; i++) {
			var value = values[i];
			var splittedValue = value.split(",");

			if(splittedValue && splittedValue.length > 1) {
				if(splittedValue[1] === "0")
					value = splittedValue[0];
				else
					value = splittedValue[0] + ',' + splittedValue[1];
			}

			result += value;
			if (i !== (values.length - 1))
				result += "<br>";
		}

		return result;
	};
}

/**
 * DynamicPipe 선언
 */
export const DYNAMIC_PIPES = [DynamicPipe];
