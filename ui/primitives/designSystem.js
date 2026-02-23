(function(){
  function cls(base, opts){
    var out = [base];
    Object.keys(opts || {}).forEach(function(k){ if (opts[k]) out.push(k); });
    return out.join(' ');
  }

  function AppCard(content, opts){
    opts = opts || {};
    return '<article class="'+cls('AppCard', {'is-loading': opts.loading, 'is-disabled': opts.disabled})+'">'+(opts.loading ? AppSkeleton() : content || '')+'</article>';
  }

  function AppButton(label, opts){
    opts = opts || {};
    return '<button class="'+cls('AppButton', {'is-loading': opts.loading, 'is-disabled': opts.disabled})+'" '+(opts.disabled ? 'disabled' : '')+'>'+(opts.loading ? 'Loading...' : (label || 'Button'))+'</button>';
  }

  function AppInput(opts){
    opts = opts || {};
    return '<input class="AppInput '+(opts.loading ? 'is-loading' : '')+'" '+(opts.disabled ? 'disabled' : '')+' placeholder="'+(opts.placeholder || '')+'" value="'+(opts.value || '')+'" />';
  }

  function AppSwitch(opts){
    opts = opts || {};
    return '<label class="AppSwitch '+(opts.disabled ? 'is-disabled' : '')+'"><input type="checkbox" '+(opts.checked ? 'checked' : '')+' '+(opts.disabled ? 'disabled' : '')+' /><span>'+(opts.label || '')+'</span></label>';
  }

  function AppSelect(options, opts){
    opts = opts || {};
    var items = (options || []).map(function(item){
      return '<option value="'+item.value+'" '+(item.value === opts.value ? 'selected' : '')+'>'+item.label+'</option>';
    }).join('');
    return '<select class="AppSelect" '+(opts.disabled ? 'disabled' : '')+'>'+items+'</select>';
  }

  function AppSkeleton(){
    return '<div class="AppSkeleton" aria-hidden="true"></div>';
  }

  function AppSection(title, content){
    return '<section class="AppSection">'+(title ? '<h2 class="section-title">'+title+'</h2>' : '')+content+'</section>';
  }

  function AppStat(label, value, meta){
    return '<div class="AppStat"><div class="AppStat-label">'+label+'</div><div class="AppStat-value">'+value+'</div>'+(meta ? '<div class="home-meta">'+meta+'</div>' : '')+'</div>';
  }

  function AppPage(content){ return '<div class="AppPage">'+content+'</div>'; }
  function AppContainer(content){ return '<div class="AppContainer">'+content+'</div>'; }
  function AppGrid(content){ return '<div class="AppGrid">'+content+'</div>'; }

  window.DesignSystem = {
    AppCard: AppCard,
    AppButton: AppButton,
    AppInput: AppInput,
    AppSwitch: AppSwitch,
    AppSelect: AppSelect,
    AppSkeleton: AppSkeleton,
    AppSection: AppSection,
    AppStat: AppStat,
    AppPage: AppPage,
    AppContainer: AppContainer,
    AppGrid: AppGrid
  };
})();
