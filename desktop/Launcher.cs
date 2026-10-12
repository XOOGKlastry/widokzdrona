using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Net;
using System.Net.Sockets;
using System.Windows.Forms;
class Widok : Form {
    Process helper;
    string address;
    bool closing;
    Label status = new Label();
    Button open = new Button();
    TextBox log = new TextBox();
    public Widok() {
        Text = "Widok z drona"; ClientSize = new Size(530,310);
        StartPosition = FormStartPosition.CenterScreen;
        BackColor = Color.FromArgb(244,243,236);
        Font = new Font("Segoe UI",10);
        status.SetBounds(24,20,480,50);status.Text="Uruchamianie aplikacji...";
        open.SetBounds(24,80,230,42);open.Text="Otworz edytor";open.Enabled=false;
        open.Click += delegate { if(address!=null) Process.Start(new ProcessStartInfo(address){UseShellExecute=true}); };
        log.SetBounds(24,140,480,140);log.Multiline=true;log.ReadOnly=true;log.ScrollBars=ScrollBars.Vertical;
        Controls.Add(status);Controls.Add(open);Controls.Add(log);
        Shown += delegate { StartHelper(); };
        FormClosing += (s,e) => {
            if(helper!=null && !helper.HasExited && MessageBox.Show("Zapisz projekt w edytorze przed zamknieciem. Zakonczyc aplikacje?",Text,MessageBoxButtons.YesNo)!=DialogResult.Yes){e.Cancel=true;return;}
            // Closing this window owns only the helper started by this instance.
            closing=true;
            if(helper!=null) { try {if(!helper.HasExited)helper.Kill();}catch(InvalidOperationException){} helper.Dispose(); }
        };
    }
    void UpdateUI(Action action) { if(!closing && IsHandleCreated) BeginInvoke(action); }
    void StartHelper() {
        try {
            string root=AppDomain.CurrentDomain.BaseDirectory;
            string script=Path.Combine(root,"Start-Widok.ps1");
            if(!File.Exists(script)||!File.Exists(Path.Combine(root,"index.html")))throw new Exception("Rozpakuj cala paczke ZIP przed uruchomieniem.");
            var probe=new TcpListener(IPAddress.Loopback,0);probe.Start();
            int port=((IPEndPoint)probe.LocalEndpoint).Port;probe.Stop();
            var info=new ProcessStartInfo("powershell.exe","-NoProfile -ExecutionPolicy Bypass -STA -File \""+script+"\" -Port "+port+" -NoBrowser");
            info.WorkingDirectory=root;info.UseShellExecute=false;info.CreateNoWindow=true;info.RedirectStandardOutput=true;info.RedirectStandardError=true;
            helper=new Process();helper.StartInfo=info;helper.EnableRaisingEvents=true;
            helper.OutputDataReceived+=(s,e)=>{
                if(e.Data==null)return;
                if(e.Data.StartsWith("READY:")){
                    string ready=e.Data.Substring(6);
                    UpdateUI(()=>{address=ready;status.Text="Aplikacja dziala. Pozostaw to okno otwarte.";open.Enabled=true;open.PerformClick();});
                } else UpdateUI(()=>log.AppendText(e.Data+Environment.NewLine));
            };
            helper.ErrorDataReceived+=(s,e)=>{if(e.Data!=null)UpdateUI(()=>log.AppendText(e.Data+Environment.NewLine));};
            helper.Exited+=(s,e)=>UpdateUI(()=>{status.Text="Pomocnik zakonczyl dzialanie. Szczegoly ponizej.";open.Enabled=false;});
            helper.Start();helper.BeginOutputReadLine();helper.BeginErrorReadLine();
        } catch(Exception e) {status.Text="Nie udalo sie uruchomic aplikacji.";log.Text=e.Message;}
    }
    [STAThread] static void Main() {Application.EnableVisualStyles();Application.SetCompatibleTextRenderingDefault(false);Application.Run(new Widok());}
}
