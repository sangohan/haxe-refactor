import hant.FileSystemTools;
import hant.Log;
import haxe.io.Path;
import sys.FileSystem;
import sys.io.File;
using StringTools;

typedef FileApi =
{
	function save(outPath:String, text:String) : Bool;
}

class TextFile
{
	public var inpPath(default, null) : String;
	public var outPath(default, null) : String;
	var verbose : Bool;
	
	public var text(default, null) : String;
	var isWinLineEndStyle : Bool;
	var isMacLineEndStyle : Bool;
	
	
	public function new(inpPath:String, outPath:String, verbose:Bool)
	{
		this.inpPath = inpPath;
		this.outPath = outPath;
		this.verbose = verbose;
		
		text = File.getContent(inpPath);
		
		isWinLineEndStyle = text.indexOf("\r\n") >= 0;
		if (isWinLineEndStyle) text = text.replace("\r\n", "\n");
		
		isMacLineEndStyle = !isWinLineEndStyle && text.indexOf("\r") >= 0;
		if (isMacLineEndStyle) text = text.replace("\r", "\n");
	}
	
	public function process(f:String->FileApi->String)
	{
		var text = f(this.text, cast this);
		
		if (text != null)
		{
			if (save(outPath, text))
			{
				if (verbose) Log.echo("Fixed: " + outPath);
			}
		}
	}
	
	function save(outPath:String, text:String) : Bool
	{
		if (inpPath == outPath && text == this.text) return false;
		
		this.text = text;		
		
		if (isMacLineEndStyle) text = text.replace("\n", "\r");
		else
		if (isWinLineEndStyle) text = text.replace("\n", "\r\n");
		
		var r = false;
		var isHidden = FileSystemTools.getHiddenFileAttribute(outPath);
		if (isHidden) FileSystemTools.setHiddenFileAttribute(outPath, false);
		if (!FileSystem.exists(outPath) || File.getContent(outPath) != text)
		{
			FileSystem.createDirectory(Path.directory(outPath));
			File.saveContent(outPath, text);
			r = true;
		}
		if (isHidden) FileSystemTools.setHiddenFileAttribute(outPath, true);
		return r;
	}
}