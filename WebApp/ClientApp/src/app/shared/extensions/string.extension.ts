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
/**
 * 전역 확장 메서드
 */
interface String {
		isEmpty(): boolean;
		toMultiLine(): string;
		toMultiLineFromCR(): string;
		toShortDateString(): string;
		toLongDateString(): string;
}


/**
 * 확장 - 값이 비어있는지를 체크한다
 */
String.prototype.isEmpty = function (): boolean {
		return this == null || this.length == 0;
};


/**
 * 확장 - replaceAll 의 사용법과 유사 설정한 캐릭터를 기준으로 변환한다
 */
String.prototype.toMultiLine = function (): string {
		let regex = /,/gi;

		if (this.isEmpty())
				return this;

		return this.replace(regex, "<br>");
};

/**
 * 확장 - replaceAll 의 사용법과 유사 설정한 캐릭터를 기준으로 변환한다
 */
String.prototype.toMultiLineFromCR = function (): string {
	let regex = /\n|\s{2,}/g;

	if (this.isEmpty())
		return this;

	return this.replace(regex, "<br>");
};

/**
 * yyyy-MM-dd 형식의 문자열로 변환
 * Date 타입에 담겨있지만 문자열로 취급되는 경우 오류를 방지하기 위함.
 */
String.prototype.toShortDateString = function (): string {
		// "2018-05-09 15:10:48" 형식으로 올 경우 IE에서 parse error 발생, 에러 방지 위해 "2018-05-09T15:10:48"형식으로 변경
		const date = this.replace(/^(.*-[0-9][0-9])(\ )([0-9][0-9]\:.*$)/, '$1T$3');
		const d = Date.parse(date);

		//숫자가 아닌 경우 Date가 아니기 때문에 의도한 결과가 나오지 않을 것이므로 빈 문자열을 반환함.
		if (isNaN(d))
				return '';

		const dd = new Date(d);

		return dd.getFullYear() + '-' +
				("0" + (dd.getMonth() + 1)).slice(-2) + "-" +
				("0" + dd.getDate()).slice(-2);
};

/**
 * yyyy-MM-dd HH:mm:ss 형식의 문자열로 변환
 * Date 타입에 담겨있지만 문자열로 취급되는 경우 오류를 방지하기 위함.
 */
String.prototype.toLongDateString = function (): string {
		// "2018-05-09 15:10:48" 형식으로 올 경우 IE에서 parse error 발생, 에러 방지 위해 "2018-05-09T15:10:48"형식으로 변경
		const date = this.replace(/^(.*-[0-9][0-9])(\ )([0-9][0-9]\:.*$)/, '$1T$3');
		const d = Date.parse(date);

		//숫자가 아닌 경우 Date가 아니기 때문에 의도한 결과가 나오지 않을 것이므로 빈 문자열을 반환함.
		if (isNaN(d))
				return '';

		const dd = new Date(d);

		return dd.getFullYear() + '-' +
				("0" + (dd.getMonth() + 1)).slice(-2) + "-" +
				("0" + dd.getDate()).slice(-2) + " " +
				("0" + dd.getHours()).slice(-2) + ":" +
				("0" + dd.getMinutes()).slice(-2) + ":" +
				("0" + dd.getSeconds()).slice(-2);
};
