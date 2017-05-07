/// <reference path="../typings/globals/node/index.d.ts" />
"use strict";
class TsToHaxeStdTypes {
    static getAll() {
        return new Map([
            ["any", "Dynamic"],
            ["void", "Void"],
            ["string", "String"],
            ["number", "Float"],
        ]);
    }
    ;
}
exports.TsToHaxeStdTypes = TsToHaxeStdTypes;