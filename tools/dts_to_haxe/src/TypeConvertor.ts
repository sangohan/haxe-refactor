import * as ts from "typescript";
import { TypePathTools } from "./TypePathTools"

export class TypeConvertor
{
    private mapper : Map<string, string>;
    
    /**
     * Keys:
     *  `mypack.MyClas<T` - type of class <TypeParameter>
     *  `mypack.MyClas@myFuncOrVar` - return type of the function or variable type
     *  `mypack.MyClas@myFunc.a` - type of the parameter "a"
     *  `.a` - type of the all parameters "a"
     *  `@myFuncOrVar` - return type of the all functions or variables
     *  `fromType` - specified type in any place
     */
    constructor(custom:Map<string, string>)
    {
        this.mapper = new Map<string, string>
        ([
            [ "any", "Dynamic" ],
            [ "void", "Void" ],
            [ "string", "String" ],
            [ "number", "Float" ],
            [ "boolean", "Bool" ],
            [ "Object", "Dynamic" ],
            [ "Function", "haxe.Constraints.Function"]
        ]);
        
        for (let k of custom.keys())
        {
            this.mapper.set(k, custom.get(k));
        }
    }

    /**
     * localePath:
     *  `mypack.MyClas<T` - type of class <TypeParameter>
     *  `mypack.MyClas@myFuncOrVar` - return type of the function or variable type
     *  `mypack.MyClas@myFunc.a` - type of the parameter "a"
     */
    convert(type:string, localePath:string, knownTypes:Array<string>, curPack:string) : string
    {
        if (type == "this" && localePath && localePath.indexOf("@") > 0)
        {
            type = localePath.split("@")[0];
        }
        
        if (type.indexOf(".") >= 0)
        {
            var possibleKnownType = TypePathTools.normalizeFullClassName(TypePathTools.makeFullClassPath([ curPack, type ]));
            if (knownTypes.indexOf(possibleKnownType) >= 0) type = possibleKnownType;
        }

        type = this.mapper.has(type) ? this.getMapperValue(type, localePath) : type;

        if (localePath)
        {
            if (localePath.startsWith("@")) localePath = "." + localePath.substring(1); // literal (anonimous) types

            if (this.mapper.has(localePath))
            {
                let r = this.testIf(type, this.getMapperValue(localePath, localePath));
                if (r) return r;
            }

            if (this.mapper.has(localePath.replace("@", "*")))
            {
                let r = this.testIf(type, this.getMapperValue(localePath.replace("@", "*"), localePath));
                if (r) return r;
            }

            if (localePath.indexOf("<") < 0)
            {
                var m = localePath.indexOf("@");
                
                if (m >= 0)
                {
                    if (this.mapper.has(localePath.substring(m)))
                    {
                        let r = this.testIf(type, this.getMapperValue(localePath.substring(m), localePath));
                        if (r) return r;
                    }
                    if (this.mapper.has("*" + localePath.substring(m + 1)))
                    {
                        let r = this.testIf(type, this.getMapperValue("*" + localePath.substring(m + 1), localePath));
                        if (r) return r;
                    }
                    var n = localePath.lastIndexOf(".");
                    if (n > m)
                    {
                        if (this.mapper.has(localePath.substring(n)))
                        {
                            let r = this.testIf(type, this.getMapperValue(localePath.substring(n), localePath));
                            if (r) return r;
                        }
                        if (this.mapper.has("*" + localePath.substring(n + 1)))
                        {
                            let r = this.testIf(type, this.getMapperValue("*" + localePath.substring(n + 1), localePath));
                            if (r) return r;
                        }
                    }
                }
            }
        }
        
        if (type == "self" && localePath.indexOf("@") > 0)
        {
            return localePath.split("@")[0];
        }
        
        return type;
    }

    private testIf(sourceType, resultType:string) : string
    {
        var match = /^(.+?)\s+if\s+(.+)$/.exec(resultType);
        if (!match) return resultType;
        return match[2] === sourceType ? match[1] : null
    }

    private getMapperValue(key:string, localePath:string) : string
    {
        var v = this.mapper.get(key);
        if (v && localePath && localePath.indexOf("@") > 0) v = v.replace(/\bself\b/g, localePath.split("@")[0]);
        return v;
    }
}