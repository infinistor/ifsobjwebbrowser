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
import {ResponseS3AclGrant} from "./response-s3-acl-grant.model";

export class ResponseS3AclGrantForGrid {
	public Id: string = "";
	public OrderNo: number = 0;
	public Name: string = "";

	public Read: boolean = false;
	public Write: boolean = false;
	//public FullControl: boolean = false;

	// public get Read(): boolean {
	// 	if (this.write)
	// 		return false;
	// 	else
	// 		return this.read;
	// }
	//
	// public set Read(value: boolean) {
	// 	this.read = value;
	// }
	//
	// private read: boolean = false;
	//
	// public get Write(): boolean {
	// 	if (this.read)
	// 		return false;
	// 	else
	// 		return this.write;
	// }
	//
	// public set Write(value: boolean) {
	// 	this.write = value;
	// }
	//
	// private write: boolean = false;
	//
	// public get FullControl(): boolean {
	// 	if (this.read && this.write)
	// 		return true;
	// 	else
	// 		return false;
	// }
	//
	// public set FullControl(value: boolean) {
	// 	this.write = value;
	// 	this.read = value;
	//
	// 	if(!this.read && !this.write) {
	// 		this.read = true;
	// 	}
	// }



	constructor(value: ResponseS3AclGrant) {

		if (value && value.Grantee && value.Grantee.Type && value.Permission) {
			if (value.Grantee.Type === "CanonicalUser") {
				this.Id = value.Grantee.Type + "|" + value.Grantee.CanonicalUser;
				this.Name = value.Grantee.CanonicalUser;
				this.OrderNo = 0;
			}
			else if (value.Grantee.Type === "Group") {
				if(value.Grantee.URI === "http://acs.amazonaws.com/groups/global/AuthenticatedUsers") {
					this.Id = value.Grantee.Type + "|" + value.Grantee.URI;
					this.Name = "Authenticated Users";
					this.OrderNo = 1;
				}
				else if(value.Grantee.URI === "http://acs.amazonaws.com/groups/global/AllUsers") {
					this.Id = value.Grantee.Type + "|" + value.Grantee.URI;
					this.Name = "All Users";
					this.OrderNo = 2;
				}
				else
					return;
			}

			const permissions: string[] = value.Permission.split(',');
			for(const permission of permissions) {
				if(permission === "READ")
					this.Read = true;
				else if(permission === "WRITE")
					this.Write = true;
				else if(permission === "FULL_CONTROL") {
					this.Read = true;
					this.Write = true;
				}
			}
		}
	}
}
